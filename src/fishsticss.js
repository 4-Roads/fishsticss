// TODO: prevent capturing spaces at the end of a match so we don't use trim() everywhere
var PATTERNS = {
  selector: /(.+?){\s*([\S\s]*?)\s*\}/gm,
  rule: /(.+?):(.+?);*/gm,
  comment: /\/\*[\S\s]*\*\//gm
};

var TAB_CHARACTER = ' ';
var TAB_SIZE = 2;

var fishsticss = {

  _soak: function(css) {

    var styles = {};

    var match = PATTERNS.selector.exec(css);
    while (match) {

      var selector = match[1].trim();

      // TODO: use a fat arrow function for this filter
      var rules = match[2].trim().split(';').filter(function(rule) {
        return rule;
      }).reduce(function(a, b) {
        var rule = b.split(':').filter(function(rule) {
          return rule;
        });
        a[rule[0].trim()] = rule[1].trim();
        return a;
      }, {});

      if (styles[selector]) {
        styles[selector].rules = Object.assign(styles[selector].rules, rules);
      } else {
        styles[selector] = {rules: rules};
      }

      match = PATTERNS.selector.exec(css);
    }

    return styles;
  },

  _scrub: function(styles) {

    var selectors = Object.keys(styles);
    for (var key in styles) {

      var selectorIndex = -1;
      for (var i = 0; i < selectors.length; i++) {
        if (key !== selectors[i] && key.indexOf(selectors[i]) === 0) {
          selectorIndex = i;
        }
      }

      if (selectorIndex > -1) {
        var parentSelector = selectors[selectorIndex];
        if (key !== parentSelector) {
          if (!styles[parentSelector].children) {
            styles[parentSelector].children = {};
          }
          var childSelector = key.replace(parentSelector, '');
          if (childSelector.charAt(0) !== ' ') {
            childSelector = '&' + childSelector;
          }
          styles[parentSelector].children[childSelector.trim()] = styles[key];
          styles[parentSelector].children = this._sort(styles[parentSelector].children);

          styles[key].nested = true;
        }
      }
    }

    return styles;
  },

  _sort: function(styles) {

    var selectors = Object.keys(styles).reverse();
    for (var i = selectors.length - 1; i >= 0; i--) {
      var nextIndex = selectors[i].indexOf('&') === 0 ? 0 : selectors.length - 1;
      selectors.splice(nextIndex, 0, selectors.splice(i, 1)[0]);
    }

    var sorted = {};
    selectors.forEach(function(selector) {
      sorted[selector] = styles[selector];
    });

    return sorted;
  },

  _rinse: function(styles) {
    for (var key in styles) {
      if (styles[key].nested) {
        delete styles[key];
      }
    }
    return styles;
  },

  wash: function(css) {
    var styles = this._soak(css);
    return this._rinse(this._scrub(styles));
  },

  _tab: function(level, options) {
    var tabCharacter = options && options.tabCharacter || TAB_CHARACTER;
    var tabSize = options && options.tabSize || TAB_SIZE;
    return tabCharacter.repeat(tabSize * level);
  },

  print: function(styles, options) {

    var output = '';
    var level = options && options.level || 0;

    for (var selector in styles) {
      var style = styles[selector];
      output += this._tab(level, options);
      output += selector + ' {\n';
      for (var property in style.rules) {
        output += this._tab(level + 1, options);
        output += property + ': ' + style.rules[property] + ';\n';
      }
      if (style.children) {
        output += this.print(style.children, {level: level + 1});
      }
      output += this._tab(level, options);
      output += '}\n';
    }

    return output;
  }
};

module.exports = fishsticss;