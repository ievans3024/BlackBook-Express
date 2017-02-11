'use strict';

class CollectionArray extends Array {

  constructor (...args) {
    let contains = args.slice(0,1)[0],
      super_args = args.slice(1);
    super(...super_args);
    if (typeof contains !== 'function') {
      throw new Error('Argument "contains" must be a function.');
    } else {
      this.contains = contains;
    }
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

    // add properties that were not set before as new empty properties
    for (property in this.property_rules) {
      if (this.property_rules.hasOwnProperty(property) && !this.hasOwnProperty(property)) {
        this[property] = new this.property_rules[property]['type']();
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
        if (r.hasOwnProperty('required') && (object === undefined || !object.hasOwnProperty(rule))) {
          throw new Error('Missing required property: ' + rule);
        } else if (object !== undefined){
          if(object.hasOwnProperty(rule)) {
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
    }

    return collection;

  }

  toString () {
    return JSON.stringify(this);
  }

  get_data (name) {

    if (this.hasOwnProperty('data')) {

      return this.get_data_from_array(this.data, 'name', name);

    } else {

      return null;

    }

  }

  get_data_from_array (array, identifier, value) {

    return array.reduce(
      function (prev, next) {

        if (prev !== null) {

          return prev;

        } else if (next[identifier] === value) {

          return next;

        } else {

          return null;

        }

      },
      null
    );

  }

  get_item (href) {

    if (this.hasOwnProperty('items')) {

      return this.get_data_from_array(this.items, 'href', href);

    } else {

      return null;

    }

  }

  get_link (href) {

    if (this.hasOwnProperty('links')) {

      return this.get_data_from_array(this.links, 'href', href);

    } else {

      return null;

    }

  }

  get_query (name) {

    if (this.hasOwnProperty('queries')) {

      return this.get_data_from_array(this.queries, 'name', name);

    } else {

      return null;

    }

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

class Data extends CollectionObject {

  get property_rules () {
    return {
      name: {type: String, required: true},
      prompt: {type: String},
      value: {type: String}
    };
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

class DataArray extends CollectionArray {

  constructor (...args) {

    args.unshift(Data);

    super(...args);

  }

}

class LinkArray extends CollectionArray {

  constructor (...args) {

    args.unshift(Link);

    super(...args);

  }

}

class Item extends CollectionObject {

  get property_rules () {

    return {
      href: {type: String, required: true},
      data: {type: DataArray},
      links: {type: LinkArray}
    };

  }

}

class ItemArray extends CollectionArray {

  constructor (...args) {

    args.unshift(Item);

    super(...args);

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

  constructor (...args) {

    args.unshift(Query);

    super(...args);

  }

}

class Template extends CollectionObject {

  get property_rules () {

    return {
      data: {type: DataArray}
    };

  }

}

class Collection extends CollectionObject {

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

module.exports = {
  'Collection': Collection,
  'CollectionArray': CollectionArray,
  'CollectionError': CollectionError,
  'CollectionObject': CollectionObject,
  'Data': Data,
  'DataArray': DataArray,
  'Item': Item,
  'ItemArray': ItemArray,
  'Link': Link,
  'LinkArray': LinkArray,
  'Query': Query,
  'QueryArray': QueryArray,
  'Template': Template
};