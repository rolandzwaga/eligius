import {Project, type SourceFile, SyntaxKind, ts} from 'ts-morph';

// Initialize a ts-morph project
const project = new Project();

// Read the input files containing the UVU test suite
const sourceFiles = project.addSourceFilesAtPaths('./src/test/**/*.spec.ts');

// Extract suite name
sourceFiles.forEach(sourceFile => {
  // Replace UVU imports with Vitest imports
  sourceFile.getImportDeclarations().forEach(importDecl => {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    if (moduleSpecifier.includes("'uvu/")) {
      importDecl.remove();
    } else if (moduleSpecifier.includes('uvu')) {
      importDecl.replaceWithText(
        `import { describe, test, beforeEach, afterEach, beforeAll, afterAll, type TestContext } from 'vitest';`
      );
    }
  });

  // Transform suite declaration
  const declaration = sourceFile.getVariableDeclarations().find(decl => {
    return decl.getInitializer()?.getText().startsWith('suite');
  });
  if (!declaration) {
    console.error(
      `Did not find a suite declaration in file ${sourceFile.getBaseName()}`
    );
    return;
  }
  const suiteName = declaration.getName();
  const callExpr = declaration.getDescendantsOfKind(
    SyntaxKind.CallExpression
  )[0];
  const suiteDescription = callExpr.getArguments()[0].getText();
  const literals = declaration.getDescendantsOfKind(SyntaxKind.TypeLiteral);
  const contextType = literals.length ? literals[0].getText() : undefined;
  if (contextType) {
    const parent = declaration.getParent().getParent();
    const idx = parent.getChildIndex();
    sourceFile.insertTypeAlias(idx, {
      name: `${suiteName}Context`,
      type: `${contextType} & TestContext`,
    });
    sourceFile.addStatements(
      `function withContext<T>(ctx: unknown): asserts ctx is T { }`
    );
  }
  const contextName = contextType ? `<${suiteName}Context>` : '';
  declaration.remove();

  sourceFile
    .getDescendantsOfKind(ts.SyntaxKind.ExpressionStatement)
    .forEach(statement => {
      if (statement.wasForgotten()) {
        return;
      }
      const expression = statement.getExpression().getText();
      const idx = statement.getChildIndex();
      const parent = statement.getParent() as SourceFile;

      // Replace ActionSuite.before.each with beforeEach
      if (expression.includes(`${suiteName}.before.each`)) {
        const arrow = statement
          .getExpression()
          .getDescendantsOfKind(SyntaxKind.ArrowFunction)[0]
          .getText();
        const braceIdx = arrow.indexOf('{') + 1;
        const newArrow = `${arrow.slice(0, braceIdx)}\nwithContext${contextName}(context);\n${arrow.slice(braceIdx)}`;
        statement.remove();
        parent.insertStatements(idx, `beforeEach(${newArrow});`);
      } else if (expression.includes(`${suiteName}.after.each`)) {
        const arrow = statement
          .getExpression()
          .getDescendantsOfKind(SyntaxKind.ArrowFunction)[0]
          .getText();
        const braceIdx = arrow.indexOf('{') + 1;
        const newArrow = `${arrow.slice(0, braceIdx)}\nwithContext${contextName}(context);\n${arrow.slice(braceIdx)}`;
        statement.remove();
        parent.insertStatements(idx, `afterEach(${newArrow});`);
      } else if (expression.includes(`${suiteName}.before`)) {
        const arrow = statement
          .getExpression()
          .getDescendantsOfKind(SyntaxKind.ArrowFunction)[0]
          .getText();
        const braceIdx = arrow.indexOf('{') + 1;
        const newArrow = `${arrow.slice(0, braceIdx)}\nwithContext${contextName}(context);\n${arrow.slice(braceIdx)}`;
        statement.remove();
        parent.insertStatements(idx, `beforeAll(${newArrow});`);
      } else if (expression.includes(`${suiteName}.after`)) {
        const arrow = statement
          .getExpression()
          .getDescendantsOfKind(SyntaxKind.ArrowFunction)[0]
          .getText();
        const braceIdx = arrow.indexOf('{') + 1;
        const newArrow = `${arrow.slice(0, braceIdx)}\nwithContext${contextName}(context);\n${arrow.slice(braceIdx)}`;
        statement.remove();
        parent.insertStatements(idx, `afterAll(${newArrow});`);
      } else if (expression.startsWith(`${suiteName}(`)) {
        const callExpr = statement.getDescendantsOfKind(
          SyntaxKind.CallExpression
        )[0];
        const args = callExpr.getArguments();
        const testName = args[0].getText();
        const testFunction = args[1].getText();
        statement.remove();
        parent.insertStatements(
          idx,
          `test${contextName}(${testName}, ${testFunction});`
        );
      } else if (statement.getText().includes('.run();')) {
        statement.remove();
      }
    });

  const expressions = sourceFile.getChildrenOfKind(
    SyntaxKind.ExpressionStatement
  );

  const describeStatement = sourceFile.addStatements(
    `describe${contextName}(${suiteDescription}, () => {});`
  )[0];
  const arrowFunc = describeStatement.getDescendantsOfKind(
    SyntaxKind.ArrowFunction
  )[0];
  if (arrowFunc) {
    const body = arrowFunc.getBody();
    if (body.isKind(SyntaxKind.Block)) {
      expressions.forEach(expr => {
        body.addStatements(expr.getText());
        expr.remove();
      });
    }
  }

  sourceFile
    .organizeImports()
    //.fixUnusedIdentifiers()
    .formatText({
      indentSize: 2,
      insertSpaceAfterCommaDelimiter: true,
      convertTabsToSpaces: true,
      insertSpaceAfterTypeAssertion: true,
      ensureNewLineAtEndOfFile: true,
      indentStyle: ts.IndentStyle.Smart,
    });
});

project.saveSync();

console.log(`Ready.`);
