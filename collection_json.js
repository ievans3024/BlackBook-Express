'use strict';

class CollectionObject {

  constructor (data) {

    let property;

    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    // validate contents
    data = this.validate(data);

    // set properties from data
    for (property in data) {
      if (data.hasOwnProperty(property)) {
        this[property] = data[property];
      }
    }

  }

  validate (object) {
    let collection = {},
        r,
        rule;

    for (rule in this.property_rules) {
      if (this.property_rules.hasOwnProperty(rule)) {
        r = this.property_rules[rule];
        if (r.hasOwnProperty('required') && !object.hasOwnProperty(rule)) {
          throw new Error('Missing required property: ' + rule);
        } else if (object.hasOwnProperty(rule)) {
          if (r.hasOwnProperty('type')) {
            if (r.type === Array) {
              collection[rule] = object[rule].map(
                function (value) {
                  if (r.hasOwnProperty('contents')) {
                    if (!(value instanceof r.contents)) {
                      return new r.contents(value);
                    } else {
                      return value;
                    }
                  } else {
                    return value;
                  }
                }
              )
            } else if (!object[rule] instanceof r.type) {
              collection[rule] = new r.type(object[rule]);
            } else {
              collection[rule] = object[rule];
            }
          }
        }
      }
    }

    return collection;

  }

  toString () {
    return JSON.stringify(this);
  }

}

class HasLinks {

  get_link (href) {
    return this.data.reduce(
      function (prev, next) {
        if (prev !== null) {
          return prev;
        } else if (next.href === href) {
          return next;
        } else {
          return null;
        }
      },
      null
    );
  }

}

class HasData {

  get_data (name) {
    return this.data.reduce(
      function (prev, next) {
        if (prev !== null) {
          return prev;
        } else if (next.name === name) {
          return next;
        } else {
          return null;
        }
      },
      null
    );
  }

}

class Collection extends CollectionObject, HasLinks {

  get property_rules () {

    return {
      error: {type: CollectionError},
      href: {type: String, required: true},
      items: {type: ItemArray, contents: Item},
      links: {type: LinkArray, contents: Link},
      queries: {type: QueryArray, contents: Query},
      template: {type: Template},
      version: {type: String, required: true}
    };

  }

  toString () {
    return JSON.stringify({collection: this});
  }

}

class CollectionArray extends Array {

  constructor () {
    let contains = arguments.slice(0,1),
        super_args = arguments.slice(1);
    if (typeof contains !== 'function') {
      throw new Error('Argument "contains" must be a function.');
    } else {
      this.contains = contains;
    }
    super(...super_args);
  }

  validate_content (object) {
    if (object instanceof this.contains) {
      return object
    } else {
      return this.contains(object);
    }
  }

  push () {
    let args = arguments.map(this.validate_content);
    return super.push(...args);
  }

  unshift () {
    let args = arguments.map(this.validate_content);
    return super.unshift(...args);
  }

  splice () {
    let items = arguments.slice(2).map(this.validate_content),
        args = arguments.slice(0,2) + items;
    return super.splice(...args);
  }

}

class DataArray extends CollectionArray {

  constructor () {

    super(Data, ...arguments);

  }

}

class Data extends CollectionObject {

  get property_rules () {
    return {
      name: {type: String, required: true},
      prompt: {type: String},
      value: {type: String}
    };
  }

}

class CollectionError extends CollectionObject {

  get property_rules () {

    return {
      title: {type: String},
      code: {type: String},
      message: {type: String}
    };
    
  }

}

class Item extends CollectionObject, HasData, HasLinks {

  get property_rules () {

    return {
      href: {type: String, required: true},
      data: {type: DataArray},
      links: {type: LinkArray}
    };

  }

}

class ItemArray extends CollectionArray {

  constructor () {

    super(Item, ...arguments);

  }

}

class Link extends CollectionObject {

  get property_rules () {

    return {
      href: {type: String, required: true},
      rel: {type: String, required: true},
      prompt: {type: String},
      name: {type: String},
      render: {type: String}
    };

  }

}

class LinkArray extends CollectionArray {

  constructor () {

    super(Link, ...arguments);

  }
  
}

class Query extends CollectionObject {

  get property_rules () {

    return {
      data: {type: DataArray},
      href: {type: String, required: true},
      name: {type: String},
      prompt: {type: String},
      rel: {type: String, required: true},
    };

  }

}

class QueryArray extends CollectionArray {

  constructor () {

    super(Query, ...arguments);

  }

}

class Template extends CollectionObject {

  get property_rules () {

    return {
        data: {type: DataArray}
    };

  }

}