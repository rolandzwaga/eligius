grammar Eligius

entry Presentation:
    ('engine' engine=NAME)? providers+=(AnimationProvider)+ 'container' container=SELECTOR 'language' language=LANG 'layout' layout=NAME 'languages' (languages+=Language (',' languages+=Language)*)? 'initialisation' initActions+=(Action)*;

AnimationProvider:
    'animation' 'provider' systemName=NAME;

Language:
    code=LANG label=NAME;

Action:
    name=NAME 'start' startOperations+=(Operation)* 'end' endOperations+=(Operation)*;

Operation:
    name=NAME '(' arguments+=(Argument)* ')';

Argument:
    name=(ARGUMENT_NAME)? value=(NUMBER|SELECTOR|NAME);

hidden terminal COLON: ':';
hidden terminal EQUALS: '=';
hidden terminal WS: /\s+/;
terminal ARGUMENT_NAME: /[a-zA-Z]+(?=\=)/;
terminal LANG: /[a-z]{2}-[A-Z]{2}/;
terminal NAME: /[a-zA-Z]+/;
terminal NUMBER returns number: /[0-9]+/;
terminal SELECTOR: /[\.#\-a-zA-Z]+/;
