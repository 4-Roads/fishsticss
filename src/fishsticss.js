
// TODO: prevent capturing spaces at the end of a match so we don't use trim() everywhere
var PATTERNS = {
  selector: /(.+?){\s*([\S\s]*?)\s*\}/gm,
  rule: /(.+?):(.+?);*/gm,
  comment: /\/\*[\S\s]*\*\//gm
};

var TAB_CHARACTER = ' ';
var TAB_SIZE = 2;

var fishsticss = {

  scrub: function(css) {

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

    var selectors = Object.keys(styles);
    for (var key in styles) {
      var selectorIndex = selectors.findIndex(function(selector) {
        return key !== selector && key.indexOf(selector) === 0;
      });
      if (selectorIndex > -1) {
        var parentSelector = selectors[selectorIndex];
        if (key !== parentSelector) {
          if (!styles[parentSelector].children) {
            styles[parentSelector].children = {};
          }
          styles[parentSelector]
              .children[key.replace(parentSelector, '').trim()] = styles[key];
          delete styles[key];
        }
      }
    }

    return styles;
  },

  tab: function(level, options) {
    var tabCharacter = options && options.tabCharacter || TAB_CHARACTER;
    var tabSize = options && options.tabSize || TAB_SIZE;
    return tabCharacter.repeat(tabSize * level);
  },

  print: function(styles, options) {

    var output = '';
    var level = options && options.level || 0;

    for (var selector in styles) {
      var style = styles[selector];
      output += this.tab(level, options);
      output += selector + ' {\n';
      for (var property in style.rules) {
        output += this.tab(level + 1, options);
        output += property + ': ' + style.rules[property] + ';\n';
      }
      if (style.children) {
        output += this.print(style.children, {level: level + 1});
      }
      output += this.tab(level, options);
      output += '}\n';
    }

    return output;
  }
};

module.exports = fishsticss;
