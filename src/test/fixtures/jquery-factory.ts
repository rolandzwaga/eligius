import {vi} from 'vitest';

/**
 * Mock jQuery element for testing controllers
 * Implements chainable API matching jQuery's interface
 */
export class MockJQueryElement {
  private _className = '';
  private _innerHTML = '';
  private _attributes: Record<string, string> = {};
  private _data: Record<string, any> = {};
  private _listeners = new Map<string, ((...args: any[]) => void)[]>();
  private _cssProperties: Record<string, string> = {};
  private _children: MockJQueryElement[] = [];

  // Properties
  length = 1;

  [index: number]: any;

  constructor() {
    // Make it array-like
    this[0] = this;
  }

  // Class manipulation (chainable)
  addClass(className: string): this {
    const classes = className.split(' ').filter(Boolean);
    classes.forEach(cls => {
      if (!this._className.includes(cls)) {
        this._className += ` ${cls}`;
      }
    });
    this._className = this._className.trim();
    return this;
  }

  removeClass(className: string): this {
    const classes = className.split(' ').filter(Boolean);
    classes.forEach(cls => {
      this._className = this._className
        .split(' ')
        .filter(c => c !== cls)
        .join(' ');
    });
    return this;
  }

  toggleClass(className: string): this {
    if (this.hasClass(className)) {
      this.removeClass(className);
    } else {
      this.addClass(className);
    }
    return this;
  }

  hasClass(className: string): boolean {
    return this._className.split(' ').includes(className);
  }

  // Content manipulation
  html(content?: string): this | string {
    if (content !== undefined) {
      this._innerHTML = content;
      return this;
    }
    return this._innerHTML;
  }

  text(content?: string): this | string {
    if (content !== undefined) {
      this._innerHTML = content;
      return this;
    }
    return this._innerHTML;
  }

  // Attribute manipulation
  attr(name: string, value?: string): this | string | undefined {
    if (value !== undefined) {
      this._attributes[name] = value;
      return this;
    }
    return this._attributes[name];
  }

  removeAttr(name: string): this {
    delete this._attributes[name];
    return this;
  }

  data(key: string, value?: any): this | any {
    if (value !== undefined) {
      this._data[key] = value;
      return this;
    }
    return this._data[key];
  }

  // CSS manipulation
  css(prop: string | Record<string, any>, value?: string): this | string {
    if (typeof prop === 'string' && value !== undefined) {
      this._cssProperties[prop] = value;
      return this;
    } else if (typeof prop === 'object') {
      Object.assign(this._cssProperties, prop);
      return this;
    } else if (typeof prop === 'string') {
      return this._cssProperties[prop] || '';
    }
    return this;
  }

  // Event handling
  on(event: string, handler: (...args: any[]) => void): this {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push(handler);
    return this;
  }

  off(event: string, handler?: (...args: any[]) => void): this {
    if (handler) {
      const handlers = this._listeners.get(event) || [];
      this._listeners.set(
        event,
        handlers.filter(h => h !== handler)
      );
    } else {
      this._listeners.delete(event);
    }
    return this;
  }

  trigger(event: string, data?: any): this {
    const handlers = this._listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
    return this;
  }

  // Mouse events (chainable shortcuts)
  click(handler?: (...args: any[]) => void): this {
    if (handler) {
      return this.on('click', handler);
    }
    return this.trigger('click');
  }

  mouseup(handler?: (...args: any[]) => void): this {
    if (handler) {
      return this.on('mouseup', handler);
    }
    return this.trigger('mouseup');
  }

  mousedown(handler?: (...args: any[]) => void): this {
    if (handler) {
      return this.on('mousedown', handler);
    }
    return this.trigger('mousedown');
  }

  // DOM traversal
  find(_selector: string): MockJQueryElement {
    return new MockJQueryElement();
  }

  parent(): MockJQueryElement {
    return new MockJQueryElement();
  }

  children(_selector?: string): MockJQueryElement {
    return new MockJQueryElement();
  }

  eq(_index: number): MockJQueryElement {
    return this;
  }

  first(): MockJQueryElement {
    return this;
  }

  last(): MockJQueryElement {
    return this;
  }

  // DOM manipulation
  append(content: string | MockJQueryElement): this {
    if (typeof content === 'string') {
      this._innerHTML += content;
    } else {
      this._children.push(content);
    }
    return this;
  }

  prepend(content: string | MockJQueryElement): this {
    if (typeof content === 'string') {
      this._innerHTML = content + this._innerHTML;
    }
    return this;
  }

  remove(): this {
    return this;
  }

  empty(): this {
    this._innerHTML = '';
    this._children = [];
    return this;
  }

  // Dimension methods
  width(value?: number): this | number {
    if (value !== undefined) {
      this._cssProperties.width = `${value}px`;
      return this;
    }
    return Number.parseInt(this._cssProperties.width, 10) || 0;
  }

  height(value?: number): this | number {
    if (value !== undefined) {
      this._cssProperties.height = `${value}px`;
      return this;
    }
    return Number.parseInt(this._cssProperties.height, 10) || 0;
  }

  // Visibility
  show(): this {
    this._cssProperties.display = 'block';
    return this;
  }

  hide(): this {
    this._cssProperties.display = 'none';
    return this;
  }

  // Utility methods for testing
  getClassName(): string {
    return this._className.trim();
  }

  getListeners(event: string): ((...args: any[]) => void)[] {
    return this._listeners.get(event) || [];
  }

  getAttributes(): Record<string, string> {
    return {...this._attributes};
  }

  getCssProperties(): Record<string, string> {
    return {...this._cssProperties};
  }
}

/**
 * Creates a mock jQuery element
 */
export function createMockJQueryElement(): any {
  return new MockJQueryElement() as any;
}

/**
 * Creates a mock jQuery function that returns mock elements
 */
export function createMockJQuery(): any {
  const jQueryFn = vi.fn((_selector?: string | Element) => {
    return createMockJQueryElement();
  });

  // Add static methods if needed
  (jQueryFn as any).ajax = vi.fn();
  (jQueryFn as any).get = vi.fn();
  (jQueryFn as any).post = vi.fn();

  return jQueryFn;
}
