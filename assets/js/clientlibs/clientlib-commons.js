/* jshint forin:true, noarg:true, noempty:true, eqeqeq:true, boss:true, undef:true, curly:true, browser:true, jquery:true */
/*
 * jQuery UI MultiSelect Widget 3.0.0
 * Copyright (c) 2012 Eric Hynds
 *
 * Depends:
 *   - jQuery 1.8+                          (http://api.jquery.com/)
 *   - jQuery UI 1.11 widget factory   (http://api.jqueryui.com/jQuery.widget/)
 *
 * Optional:
 *   - jQuery UI effects
 *   - jQuery UI position utility
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */
(function($, undefined) {
   // Counter used to prevent collisions
   var multiselectID = 0;

   // The following information can be overridden via the linkInfo option.
   // An $.extend is used to allow just specifying a partial object in linkInfo.
   var linkDefaults = {
      'open': {
         'class': 'ui-multiselect-open',
         'icon': '<span class="ui-icon ui-icon-triangle-1-s"></span',
         'title': 'Open',
      },
      'close': {
         'class': 'ui-multiselect-close',
         'icon': '<span class="ui-icon ui-icon-circle-close"></span>',
         'title': 'Close',
      },
      'checkAll': {
         'class': 'ui-multiselect-all',
         'icon': '<span class="ui-icon ui-icon-check"></span>',
         'text': 'Check all',
         'title': 'Check all',
      },
      'uncheckAll': {
         'class': 'ui-multiselect-none',
         'icon': '<span class="ui-icon ui-icon-closethick"></span>',
         'text': 'Uncheck all',
         'title': 'Uncheck all',
      },
      'flipAll': {
         'class': 'ui-multiselect-flip',
         'icon': '<span class="ui-icon ui-icon-arrowrefresh-1-w"></span>',
         'text': 'Flip all',
         'title': 'Flip all',
      },
      'collapse': {
         'icon': '<span class="ui-icon ui-icon-minusthick"></span>',
         'title': 'Collapse',
      },
      'expand': {
         'icon': '<span class="ui-icon ui-icon-plusthick"></span>',
         'title': 'Expand',
      },
      'collapseAll': {
         'class': 'ui-multiselect-collapseall',
         'icon': '<span class="ui-icon ui-icon-minus"></span>',
         'text': 'Collapse all',
         'title': 'Collapse all',
      },
      'expandAll': {
         'class': 'ui-multiselect-expandall',
         'icon': '<span class="ui-icon ui-icon-plus"></span>',
         'text': 'Expand all',
         'title': 'Expand all',
      },
   };

   /**
    * Checks an option element for data-image-src
    * and adds that as an image tag within the widget option
    *
    * @param {Node} option to pull an image from
    * @param {Node} span to insert image tag into
    */
   function insertImage(option, span) {
    var optionImageSrc = option.getAttribute('data-image-src');
    if (optionImageSrc) {
      var img = document.createElement('img');
      img.setAttribute('src', optionImageSrc);
      span.insertBefore(img, span.firstChild);
    }
  }

  /**
   * Retrieves the font size of the document
   * Defaults to 16px
   * @return {string} pixel string for font size
   */
  function determineFontSize() {
    if (window.getComputedStyle) {
      return getComputedStyle(document.body).fontSize;
    }
    return '16px';
  }

  /**
   * Creates a jQuery object from the input element
   * This can be a string selector, Node, or jQuery object
   * @param {(object|string)} elem
   * @return {object} jquery object for element
   */
  function getjQueryFromElement(elem) {
    if (!!elem.jquery) {
      return elem;
    }
    if (!!elem.nodeType) {
      return $(elem);
    }

    return $(elem).eq(0);
  }

    /**
     * Converts dimensions specified in options to pixel values.
     * Determines if specified value is a minimum, maximum or exact value.
     * The value can be a number or a string with px, pts, ems, in, cm, mm, or % units.
     * Number/Numeric string treated as pixel measurements
     *  - 30
     *  - '30'
     *  - '>30px'
     *  - '1.3em'
     *  - '20 pt'
     *  - '30%'
     * @param {string} dimText Option text (or number) containing possibly < or >, number, and a unit.
     * @param {object} $elem jQuery object (or node) to reference for % calculations.
     * @param {boolean} isHeight T/F to change from using width in % calculations.
     * @return {object} object containing pixels and -1/1/0 indicating min/max/exact.
     */
    function parse2px(dimText, $elem, isHeight) {
      if (typeof dimText !== 'string') {
         return {px: dimText, minimax: 0};
      }

      var parts = dimText.match(/([<>])?=?\s*([.\d]+)\s*([eimnptx%]*)s?/i);
      var minimax = parts[1];
      var value = parseFloat(parts[2]);
      var unit = parts[3].toLowerCase();
      var pixels = -1;
      switch (unit) {
         case 'pt':
         case 'in':
         case 'cm':
         case 'mm':
            pixels = {'pt': 4.0 / 3.0, 'in': 96.0, 'cm': 96.0 / 2.54, 'mm': 96.0 / 25.4}[unit] * value;
            break;
         case 'em':
            pixels = parseFloat(determineFontSize()) * value;
            break;
         case '%':
            if ( !!$elem ) {
               if (typeof $elem === 'string' || !$elem.jquery) {
                  $elem = $($elem);
               }
               pixels = ( !!isHeight ? $elem.parent().height() : $elem.parent().width() ) * (value / 100.0);
            } // else returns -1 default value from above.
            break;
         default:
            pixels = value;
      }
      // minimax:  -1 => minimum value, 1 => maximum value, 0 => exact value
      return {px: pixels, minimax: minimax == '>' ? -1 : ( minimax == '<' ? 1 : 0 )};
    }

   $.widget('ech.multiselect', {

   // default options
   options: {
      buttonWidth: 225, // (integer | string | 'auto' | null) Sets the min/max/exact width of the button.
      menuWidth: null, // (integer | string | 'auto' | null) If a number is provided, sets the exact menu width.
      menuHeight: 200, // (integer | string | 'auto' | 'size') Sets the height of the menu or determines it using native select's size setting.
      resizableMenu: false, // (true | false) Enables the use of jQuery UI resizable if it is loaded.
      appendTo: null, // (jQuery | DOM element | selector string)  If provided, this specifies what element to append the widget to in the DOM.
      position: {}, // (object) A jQuery UI position object that constrains how the pop-up menu is positioned.
      zIndex: null, // (integer) Overrides the z-index set for the menu container.
      classes: '', // (string) Classes that you can provide to be applied to the elements making up the widget.
      header: ['checkAll', 'uncheckAll'], // (false | string | array) False, custom string or array indicating which links to show in the header & in what order.
      linkInfo: null, // (object | null) Supply an obect of link information to use alternative icons, icon labels, or icon title text.  See linkDefaults above for object structure.
      noneSelectedText: 'Select options', // (string | null) The text to show in the button where nothing is selected.  Set to null to use the native select's placeholder text.
      selectedText: '# of # selected', // (string) A "template" that indicates how to show the count of selections in the button.  The "#'s" are replaced by the selection count & option count.
      selectedList: 0, // (integer) The actual list selections will be shown in the button when the count of selections is <= than this number.
      selectedListSeparator: ', ', // (string) This allows customization of the list separator.  Use ',<br/>' to make the button grow vertically showing 1 selection per line.
      maxSelected: null, // (integer | null)  If selected count > maxSelected, then message is displayed, and new selection is undone.
      openEffect: null, // (array) An array containing menu opening effect information.
      closeEffect: null, // (array) An array containing menu closing effect information.
      autoOpen: false, // (true | false) If true, then the menu will be opening immediately after initialization.
      htmlText: [], // (array) List of 'button' &/or 'options' indicating in which parts of the widget to treat text as html.
      wrapText: ['button', 'header', 'options'], // (array) List of 'button', 'header', &/or 'options' indicating in which parts of the widget to wrap text.
      listbox: false, // (true | false) Omits the button and instead of a pop-up inserts the open menu directly after the native select as a list box.
      addInputNames: true, // (true | false) If true, names are created for each option input in the multi-select.
      disableInputsOnToggle: true, // (true | false)  If true, each individual checkbox input is also disabled when the widget is disabled.
      groupsSelectable: true, // (true | false) Determines if clicking on an option group heading selects all of its options.
      groupsCollapsable: false, // (true | false) Determines if option groups can be collapsed.
      groupColumns: false, // (true | false)  Displays groups in a horizonal column layout.
      groupColumnsWidth: false, // (integer) The width of each select item in the groupColumns.
    },

    /**
     * This method determines which DOM element to append the menu to.   Determination process:
     * 1. Look up the jQuery object, DOM element, or string selector provided in the options.
     * 2. If nothing provided in options or lookup in #1 failed, then look for .ui-front or dialog.  (dialog case)
     * 3. If still do not have a valid DOM element to append to, then append to the document body.
     *
     * NOTE:  this.element and this.document are jQuery objects per the jQuery UI widget API.
    * @return {object} jQuery object for the DOM element to append to.
     */
    _getAppendEl: function() {
      var elem = this.options.appendTo; // jQuery object or selector, DOM element or null.

      if (elem) { // NOTE: The find below handles the jQuery selector case
        elem = getjQueryFromElement(elem);
      }
      if (!elem || !elem[0]) {
        elem = this.element.closest('.ui-front, dialog');
      }
      if (!elem.length) {
        elem = $(document.body); // Position at end of body.  Note that this returns a DOM element.
      }
      return elem;
    },

    /**
     * Constructs the button element for the widget
     * Stores the result in this.$button
     * @return{object} jQuery object for button
     */
     _buildButton: function() {
       var wrapText = this.options.wrapText || [];
       var $button = (this.$button = $(document.createElement('button')))
         .addClass('ui-multiselect ui-widget ui-state-default ui-corner-all'
           + (wrapText.indexOf('button') > -1 ? '' : ' ui-multiselect-nowrap')
           + (this.options.classes ? ' ' + this.options.classes : '')
         )
         .attr({
           'type': 'button',
           'title': this.element[0].title,
           'tabIndex': this.element[0].tabIndex,
           'id': this.element[0].id ? this.element[0].id + '_ms' : null,
         })
         .prop('aria-haspopup', true)
         .html(this._linkHTML('<span class="{{class}}" title="{{title}}">{{icon}}</span>', 'open'));

       this.$buttonlabel = $(document.createElement('span'))
         .html(this.element[0].name)
         .appendTo($button);
       return $button;
     },

     /**
      * Constructs HTML string for menu header
      * @return {string}
      */
     _buildHeaderHtml: function() {
       // Header controls will contain the links & ordering specified by the header option.
       // Depending on how the options are set, this may be empty or simply plain text
       if (!this.options.header) {
         return '';
       }
       if (typeof this.options.header === 'string') {
         return '<li>' + this.options.header + '</li>';
       }
       var headerLinksHTML = '';
       if (this.options.header.constructor == Array) {
         for (var x = 0; x < this.options.header.length; x++) {
           var linkInfoKey = this.options.header[x];
           if (linkInfoKey && linkInfoKey in this.linkInfo
             && !(this.options.maxSelected && linkInfoKey === 'checkAll')
             && ['open', 'close', 'collapse', 'expand'].indexOf(linkInfoKey) === -1) {
             headerLinksHTML += this._linkHTML('<li><a class="{{class}}" title="{{title}}">{{icon}}<span>{{text}}</span></a></li>', linkInfoKey);
           }
         }
       }

       if (this.options.header.constructor == Object) {
       var options = Object.keys(this.options.header)
       for (var x = 0; x < options.length; x++) {
          var displayText = options[x];
          var linkInfoKey = this.options.header[displayText];
          if (linkInfoKey && linkInfoKey in this.linkInfo
              && !(this.options.maxSelected && linkInfoKey === 'checkAll')
              && ['open', 'close', 'collapse', 'expand'].indexOf(linkInfoKey) === -1) {
              headerLinksHTML += this._linkHTML('<li><a class="{{class}}" title="{{title}}">{{icon}}<span>'+displayText+'</span></a></li>', linkInfoKey);
          }
        }
      }
       return headerLinksHTML;
     },

   /**
    * Performs initial widget creation
    * Widget API has already set this.element and this.options for us
    * All inserts into the DOM are performed at the end to limit performance impact
    *   - Build header links based on options and linkInfo object
    *   - Set UI effect speeds
    *   - Sets the multiselect ID using the global counter
    *   - Creates the button, header, and menu
    *   - Binds events for the widget
    *   - Calls refresh to populate the menu
    */
   _create: function() {
      var $element = this.element;
      var options = this.options;

      // Do an extend here to address link info missing from options.linkInfo--missing info defaults to that in linkDefaults.
      this.linkInfo = $.extend(true, {}, linkDefaults, options.linkInfo || {});

      // grab select width before hiding it
      this._selectWidth = $element.outerWidth();
      $element.hide();

      // Convert null/falsely option values to empty arrays for fewer problems
      options.htmlText = options.htmlText || [];
      var wrapText = ( options.wrapText = options.wrapText || [] );

      // default speed for effects
      this.speed = $.fx.speeds._default;
      this._isOpen = false;

      // Create a unique namespace for events that
      // the widget factory cannot unbind automatically.
      this._namespaceID = this.eventNamespace;
      // bump unique ID after assigning it to the widget instance
      this.multiselectID = multiselectID++;


      this.$headerLinkContainer = $( document.createElement('ul') )
            .addClass('ui-helper-reset')
            .html( this._buildHeaderHtml()
                  + ( !options.listbox
                     ? this._linkHTML('<li class="{{class}}"><a class="{{class}}" title="{{title}}">{{icon}}</a></li>', 'close')
                     : '' ) );

      // Menu header to hold controls for the menu
      var $header = ( this.$header = $( document.createElement('div') ) )
            .addClass('ui-multiselect-header ui-widget-header ui-corner-all ui-helper-clearfix')
            .append( this.$headerLinkContainer );

      // Holds the actual check boxes for inputs
      var $checkboxes = ( this.$checkboxes = $( document.createElement('ul') ) )
            .addClass('ui-multiselect-checkboxes ui-helper-reset' + (wrapText.indexOf('options') > -1 ? '' : ' ui-multiselect-nowrap'));

      // This is the menu container that will hold all the options added via refresh().
      var $menu = ( this.$menu = $( document.createElement('div') ) )
            .addClass('ui-multiselect-menu ui-widget ui-widget-content ui-corner-all'
                      + ($element[0].multiple ? '' : ' ui-multiselect-single')
                      + (!options.listbox ? '' : ' ui-multiselect-listbox')
                      + (this.options.classes ? ' ' + this.options.classes : ''))
            .append($header, $checkboxes);

      if (!options.listbox) {
        var $button = this._buildButton();
         $button.insertAfter($element);
         var $appendEl = this._getAppendEl();
         $appendEl.append($menu);
         // Set z-index of menu appropriately when it is not appended to a dialog and no z-index specified.
         if ( !options.zIndex && !$appendEl.hasClass('ui-front') ) {
            var $uiFront = this.element.closest('.ui-front, dialog');
            options.zIndex = Math.max( $uiFront && parseInt($uiFront.css('z-index'), 10) + 1 || 0,
                                                   $appendEl && parseInt($appendEl.css('z-index'), 10) + 1 || 0);
         }

         if (options.zIndex) {
            $menu.css('z-index', options.zIndex);
         }
         // Use $.extend below since the "of" position property may not be able to be supplied via the option.
         options.position = $.extend({'my': 'left top', 'at': 'left bottom', 'of': $button}, options.position || {});
      } else {
         $menu.insertAfter($element); // No button
      }

      this._bindEvents();

      // build menu
      this.refresh(true);
   },

    /**
     * Helper function used in _create()
    * @param {string} linkTemplate HTML link template string
    * @param {string} linkID key string to look up in linkInfo object.
    * @return {object} link HTML
     */
   _linkHTML: function(linkTemplate, linkID) {
      var self = this;
      return linkTemplate.replace(/{{(.*?)}}/ig, function(m, p1) {
 return self.linkInfo[linkID][p1];
} )
                                 .replace('<span></span>', '');
   },

    /**
     * https://api.jqueryui.com/jquery.widget/#method-_init
     * Performed every time the widget is instantiated, or called with only an options object
     *  - Set visibility of header links
     *  - Auto open menu if appropriate
     *  - Set disabled status
     */
    _init: function() {
      var elSelect = this.element[0];

      if (this.options.header !== false) {
         this.$headerLinkContainer
              .find('.ui-multiselect-all, .ui-multiselect-none, .ui-multiselect-flip')
              .toggle( !!elSelect.multiple );
      } else {
         this.$header.hide();
      }

      if (this.options.autoOpen && !this.options.listbox) {
        this.open();
      }

      if (elSelect.disabled) {
        this.disable();
      }
    },

    /**
    * Builds an option item for the menu.  (Mostly plain JS for speed.)
    * <li>
    *   <label>
    *     <input /> checkbox or radio depending on single/multiple select
    *     <span /> option text
    *   </label>
    * </li>
    * @param {node} option Option from select to be added to menu
    * @return {object} jQuery object for menu option
    */
   _makeOption: function(option) {
      var elSelect = this.element.get(0);
      // Determine unique ID for the label & option tags
      var id = elSelect.id || this.multiselectID;
      var inputID = 'ui-multiselect-' + this.multiselectID + '-' + (option.id || id + '-option-' + this.inputIdCounter++);
      // Pick up the select type from the underlying element
      var isMultiple = elSelect.multiple;
      var isDisabled = option.disabled;
      var isSelected = option.selected;

      var input = document.createElement('input');
      var inputAttribs = {
        'type': isMultiple ? 'checkbox' : 'radio',
        'id': inputID,
        'title': option.title || null,
        'value': option.value,
        'name': this.options.addInputNames ? 'multiselect_' + id : null,
        'checked': isSelected ? 'checked' : null,
        'aria-selected': isSelected ? 'true' : null,
        'disabled': isDisabled ? 'disabled' : null,
        'aria-disabled': isDisabled ? 'true' : null,
      };
      for (var name in inputAttribs) {
        if (inputAttribs[name] !== null) {
          input.setAttribute(name, inputAttribs[name]);
        }
      }
      // Clone data attributes
      var optionAttribs = option.attributes;
      var len = optionAttribs.length;
      for (var x = 0; x < len; x++) {
        var attribute = optionAttribs[x];
        if ( /^data\-.+/.test(attribute.name) ) {
          input.setAttribute(attribute.name, attribute.value);
        }
      }

      // Option text or html
      var span = document.createElement('span');
      if (this.htmlAllowedFor('options')) {
        span.innerHTML = option.innerHTML;
      } else {
        span.textContent = option.textContent;
      }

      // Icon images for each item.
      insertImage(option, span);

      var label = document.createElement('label');
      label.setAttribute('for', inputID);
      if (option.title) {
        label.setAttribute('title', option.title);
      }
      label.className += (isDisabled ? ' ui-state-disabled' : '')
                          + (isSelected && !isMultiple ? ' ui-state-active' : '')
                          + ' ui-corner-all';
      label.appendChild(input);
      label.appendChild(span);

      var item = document.createElement('li');
      item.className = (isDisabled ? 'ui-multiselect-disabled ' : '')
                        + (this.options.groupColumns ? ' ui-multiselect-columns' : '')
                        + (option.className || '');

      if (this.options.groupColumnsWidth) {
        item.style.width = this.options.groupColumnsWidth+'px';
      }

      item.appendChild(label);

      return item;
    },

    /**
     * Processes option and optgroup tags from underlying select to construct the menu's option list
     * If groupsCollapsable option is set, adds collapse/expand buttons for each option group.
     * This replaces the current contents of this.$checkboxes
     * Defers to _makeOption to actually build the options
     * Resets the input ID counter
     */
    _buildOptionList: function() {
      var self = this;
      var list = [];

      this.inputIdCounter = 0;

      this.element.children().each( function() {
        var elem = this;

        if (elem.tagName.toUpperCase() === 'OPTGROUP') {
          var options = [];

          $(elem).children().each( function() {
            options.push(self._makeOption(this));
          });

          // Build the list section for this optgroup, complete w/ option inputs...
          var $collapseButton = !!self.options.groupsCollapsable
                                 ? $( document.createElement('button') )
                                    .attr({'title': self.linkInfo.collapse.title})
                                    .addClass('ui-state-default ui-corner-all ui-multiselect-collapser')
                                    .html(self.linkInfo.collapse.icon)
                                 : null;
          var $optGroupLabel = $( document.createElement('a') )
                                    .addClass('ui-multiselect-grouplabel'
                                      + (self.options.groupsSelectable ? ' ui-multiselect-selectable' : ''))
                                    .html( elem.getAttribute('label') );
          var $optionGroup = $( document.createElement('ul') ).append(options);
          var $optGroupItem = $( document.createElement('li') )
                                 .addClass('ui-multiselect-optgroup'
                                    + (self.options.groupColumns ? ' ui-multiselect-columns' : '')
                                    + (elem.className ? ' ' + elem.className : ''))
                                 .append($collapseButton, $optGroupLabel, $optionGroup);

          if (self.options.groupColumnsWidth) {
            $optGroupItem.css('width', self.options.groupColumnsWidth+'px');
          }

          list.push($optGroupItem);
        } else {
          list.push(self._makeOption(elem));
        }
      });

      this.$checkboxes.empty().append(list);
   },

    /**
     * Refreshes the widget's menu
     *  - Refresh header links if required
     *  - Rebuild option list
     *  - Update the cached values for height, width, and cached elements
     *  - If listbox option is set, shows the menu and sets menu size.
     * @param {boolean} init If false, broadcasts a refresh event
     */
    refresh: function(init) {
      var $element = this.element;

      // update header link container visibility if needed
      if (this.options.header !== false) {
         this.$headerLinkContainer
              .find('.ui-multiselect-all, .ui-multiselect-none, .ui-multiselect-flip')
              .toggle( !!$element[0].multiple );
      }

      this._buildOptionList(); // Clear and rebuild the menu.
      this._updateCache(); // cache some more useful elements

      if (!this.options.listbox) {
         this._setButtonWidth();
         this.update(true);
      } else {
         if (!this._isOpen) {
            this.$menu.show();
            this._isOpen = true;
         }
         this._setMenuWidth();
         this._setMenuHeight();
      }

      // broadcast refresh event; useful for widgets
      if (!init) {
        this._trigger('refresh');
      }
    },

    /**
     * Updates cached values used elsewhere in the widget
     * Causes the filter to also update its cache if the filter is loaded
     */
    _updateCache: function() {
      // Invalidate cached dimensions to force recalcs.
      this._savedButtonWidth = 0;
      this._savedMenuWidth = 0;
      this._savedMenuHeight = 0;

      // Recreate important cached jQuery objects
      this.$header = this.$menu.children('.ui-multiselect-header');
      this.$checkboxes = this.$menu.children('.ui-multiselect-checkboxes');

      // Update saved labels and inputs
      this.$labels = this.$menu.find('label:not(.ui-multiselect-filter-label)');
      this.$inputs = this.$labels.children('input');

      // If the filter widget is in use, then also update its cache.
      if ( this.element.is(':data("ech-multiselectfilter")') ) {
            this.element.data('ech-multiselectfilter').updateCache(true);
      }
    },

    /**
     * Updates the widget checkboxes' checked states
     * from the native select options' selected states.
     * @param {boolean} skipDisabled If true, disabled options in either are skipped.
     */
    resync: function(skipDisabled) {
      var $inputs = this.$inputs;
      var $options = this.element.find('option');

      if ($inputs.length === $options.length) {
         var inputValues = {};
         $inputs.not(!!skipDisabled ? ':disabled' : '').each( function() {
            inputValues[this.value] = this;
         });
         $options.not(!!skipDisabled ? ':disabled' : '').each( function() {
            if (this.value in inputValues) {
               inputValues[this.value].checked = this.selected;
            }
         });
         this._trigger('resync');
         this.update();
      } else {
         this.refresh();
      }
    },

   /**
    * Updates the button text
    * If selectedText option is a function, simply call it
    * The selectedList option determines how many options to display
    *   before switching to # of # selected
    * This does not apply in listbox mode
    * @param {boolean} isDefault true if value is default value for the button
    */
    update: function(isDefault) {
      if (!!this.options.listbox) {
         return;
      }
      var options = this.options;
      var selectedList = options.selectedList;
      var selectedText = options.selectedText;
      var $inputs = this.$inputs;
      var inputCount = $inputs.length;
      var $checked = $inputs.filter(':checked');
      var numChecked = $checked.length;
      var value;

      if (numChecked) {
        if (typeof selectedText === 'function') {
          value = selectedText.call(this, numChecked, inputCount, $checked.get());
        } else if (/\d/.test(selectedList) && selectedList > 0 && numChecked <= selectedList) {
          value = $checked.map(function() {
 return $(this).next().text().replace(/\n$/, '');
})
                          .get().join(options.selectedListSeparator);
        } else {
			name=this.element[0].name+' selected';
          value = selectedText.replace('#', numChecked).replace('#', inputCount).replace('selected',name);
        }
      } else {
        value = 'Select '+this.element[0].name;
      }

      this._setButtonValue(value, isDefault);

      if ( options.wrapText.indexOf('button') === -1 ) {
         this._setButtonWidth(true);
      }

      // Check if the menu needs to be repositioned due to button height changing from adding/removing selections.
      if (this._isOpen && this._savedButtonHeight != this.$button.outerHeight(false)) {
         this.position();
      }
    },

    /**
     * Sets the button text
     * @param {string} value content to be assigned to the button
     * @param {boolean} isDefault true if value is default value for the button
     */
    _setButtonValue: function(value, isDefault) {
      this.$buttonlabel[this.htmlAllowedFor('button') ? 'html' : 'text'](value);

      if (!!isDefault) {
        this.$button[0].defaultValue = value;
      }
    },

    /**
     * Sets button events for mouse and keyboard interaction
     * Called by _bindEvents
     */
    _bindButtonEvents: function() {
      var self = this;
      var $button = this.$button;
      /**
       * @return {Boolean} always false
       */
      function buttonClickHandler() {
         self[self._isOpen ? 'close' : 'open']();
         return false;
      }

      $button
        .on({
          click: buttonClickHandler,
          keydown: $.proxy(self._handleButtonKeyboardNav, self),
          mouseenter: function() {
            if (!this.classList.contains('ui-state-disabled')) {
              this.classList.add('ui-state-hover');
            }
          },
          mouseleave: function() {
            this.classList.remove('ui-state-hover');
          },
          focus: function() {
            if (!this.classList.contains('ui-state-disabled')) {
              this.classList.add('ui-state-focus');
            }
          },
          blur: function() {
            this.classList.remove('ui-state-focus');
          },
        })
        // webkit doesn't like it when you click on the span :(
        .find('span')
        .on('click.multiselect,click', buttonClickHandler);
    },

    // Handle keyboard events for the multiselect button.
    _handleButtonKeyboardNav: function(e) {
       // Change selection via up/down on a closed single select.
       if (!this._isOpen && !this.element[0].multiple && (e.which === 38 || e.which === 40) ) {
         var $inputs = this.$inputs;
         var index = $inputs.index( $inputs.filter(':checked') );
         if (e.which === 38 && index) {
            $inputs.eq(index - 1).trigger('click');
         } else if (e.which === 40 && index < $inputs.length - 1) {
            $inputs.eq(index + 1).trigger('click');
         }
         return;
      }

      switch (e.which) {
         case 27: // esc
         case 37: // left
         case 38: // up
            this.close();
            break;
         case 40: // down
         case 39: // right
            this.open();
            break;
      }
    },

    /**
     * Bind events to the checkboxes for options and option groups
     * Must be bound to the checkboxes container.
     * This method scopes actions to filtered options
     * Called by _bindEvents
     */
    _bindCheckboxEvents: function() {
      var self = this;

      // optgroup label toggle support
      self.$checkboxes.on('click.multiselect', '.ui-multiselect-grouplabel', function(e) {
        e.preventDefault();

        if (!self.options.groupsSelectable) {
           return false;
        }

        var $this = $(this);
        var $inputs = $this.next('ul').children(':not(.ui-multiselect-excluded)').find('input').not(':disabled');
        var nodes = $inputs.get();
        var label = this.textContent;

        // trigger before callback and bail if the return is false
        if (self._trigger('beforeoptgrouptoggle', e, {inputs: nodes, label: label}) === false) {
          return;
        }

        // if maxSelected is in use, cannot exceed it
        var maxSelected = self.options.maxSelected;
        if (maxSelected && (self.$inputs.filter(':checked').length + $inputs.length > maxSelected) ) {
          return;
        }

        // toggle inputs
        self._toggleChecked(
          $inputs.filter(':checked').length !== $inputs.length,
          $inputs
        );

        self._trigger('optgrouptoggle', e, {
          inputs: nodes,
          label: label,
          checked: nodes.length ? nodes[0].checked : null,
        });
      })
      // collapse button
      .on('click.multiselect', '.ui-multiselect-collapser', function(e) {
        var $this = $(this);
              var $parent = $this.parent();
              var optgroupLabel = $parent.find('.ui-multiselect-grouplabel').first().html();
              var linkInfo = self.linkInfo;
              var collapsedClass = 'ui-multiselect-collapsed';
              var isCollapsed = $parent.hasClass(collapsedClass);

        if (self._trigger('beforecollapsetoggle', e, {label: optgroupLabel, collapsed: isCollapsed}) === false) {
          return;
        }
        $parent.toggleClass(collapsedClass);

        $this.attr('title', isCollapsed ? linkInfo.collapse.title : linkInfo.expand.title)
               .html(isCollapsed ? linkInfo.collapse.icon : linkInfo.expand.icon );

        if (!self.options.listbox) {
           self._setMenuHeight(true);
        }

        self._trigger('collapsetoggle', e, {label: optgroupLabel, collapsed: !isCollapsed});
      })
      // collapse button
      .on('mouseenter.multiselect', '.ui-multiselect-collapser', function(e) {
         this.classList.add('ui-state-hover');
      })
      // collapse button
      .on('mouseleave.multiselect', '.ui-multiselect-collapser', function(e) {
         this.classList.remove('ui-state-hover');
      })
      // option label
      .on('mouseenter.multiselect', 'label', function(e, param) {
        if (!this.classList.contains('ui-state-disabled')) {
          var checkboxes = self.$checkboxes[0];
          var scrollLeft = checkboxes.scrollLeft;
          var scrollTop = checkboxes.scrollTop;
          var scrollX = window.pageXOffset;
          var scrollY = window.pageYOffset;

          self.$labels.removeClass('ui-state-hover');
          $(this).addClass('ui-state-hover').find('input').focus();

          // Restore scroll positions if altered by setting input focus
          if ( !param || !param.allowScroll ) {
            checkboxes.scrollLeft = scrollLeft;
            checkboxes.scrollTop = scrollTop;
            window.scrollTo(scrollX, scrollY);
          }
        }
      })
      // Keyboard navigation of the menu
      .on('keydown.multiselect', 'label', function(e) {
        // Don't capture function keys or 'r'
        if (e.which === 82) {
          return; // r
        }

        if (e.which > 111 && e.which < 124) {
          return; // Function keys.
        }

        e.preventDefault();
        switch (e.which) {
          case 9: // tab
            if (e.shiftKey) {
              self.$menu.find('.ui-state-hover').removeClass('ui-state-hover');
              self.$header.find('li').last().find('a').focus();
            } else {
              self.close();
            }
            break;
          case 27: // esc
            self.close();
            break;
          case 38: // up
          case 40: // down
          case 37: // left
          case 39: // right
            self._traverse(e.which, this);
            break;
          case 13: // enter
          case 32: // space
            $(this).find('input')[0].click();
            break;
          case 65: // Alt-A
            if (e.altKey) {
              self.checkAll();
            }
            break;
          case 70: // Alt-F
            if (e.altKey) {
              self.flipAll();
            }
            break;
          case 85: // Alt-U
            if (e.altKey) {
              self.uncheckAll();
            }
            break;
        }
      })
      .on('click.multiselect', 'input', function(e) {
        // Reference to this checkbox / radio input
        var input = this;
        var $input = $(input);
        var val = input.value;
        var checked = input.checked;
        // self is cached from outer scope above
        var $element = self.element;
        var $tags = $element.find('option');
        var isMultiple = $element[0].multiple;
        var $allInputs = self.$inputs;
        var numChecked = $allInputs.filter(':checked').length;
        var options = self.options;
        var textFxn = self.htmlAllowedFor('options') ? 'html' : 'text';
        var optionText = $input.parent().find('span')[textFxn]();
        var maxSelected = options.maxSelected;

        // bail if this input is disabled or the event is cancelled
        if (input.disabled || self._trigger('click', e, {value: val, text: optionText, checked: checked}) === false) {
          e.preventDefault();
          return;
        }

        if (maxSelected && checked && numChecked > maxSelected) {
         if (self._trigger('maxselected', e, {labels: self.$labels, inputs: $allInputs}) !== false) {
            self.buttonMessage('<center><b>LIMIT OF ' + (numChecked - 1) + ' REACHED!</b></center>');
         }
          input.checked = false;
          e.preventDefault();
          return false;
        }

        // make sure the input has focus. otherwise, the esc key
        // won't close the menu after clicking an item.
        input.focus();

        // toggle aria state
        $input.prop('aria-selected', checked);

        // change state on the original option tags
        $tags.each(function() {
          this.selected = (this.value === val ? checked : isMultiple && this.selected);
        });

        // some additional single select-specific logic
        if (!isMultiple) {
          self.$labels.removeClass('ui-state-active');
          $input.closest('label').toggleClass('ui-state-active', checked);

          // close menu
          self.close();
        }

        // fire change on the select box
        $element.trigger('change');

        // setTimeout is to fix multiselect issue #14 and #47. caused by jQuery issue #3827
        // http://bugs.jquery.com/ticket/3827
        setTimeout($.proxy(self.update, self), 10);
      });
    },

    /**
     * Binds keyboard and mouse events to the header
     * Called by _bindEvents
     */
    _bindHeaderEvents: function() {
      var self = this;

      // header links
      self.$header
      .on('click.multiselect', 'a', function(e) {
        var headerLinks = {
          'ui-multiselect-close': 'close',
          'ui-multiselect-all': 'checkAll',
          'ui-multiselect-none': 'uncheckAll',
          'ui-multiselect-flip': 'flipAll',
          'ui-multiselect-collapseall': 'collapseAll',
          'ui-multiselect-expandall': 'expandAll',
        };
        for (hdgClass in headerLinks) {
          if ( this.classList.contains(hdgClass) ) {
            // headerLinks[hdgClass] is the click handler name
              self[headerLinks[hdgClass]]();
              e.preventDefault();
              return false;
          }
        }
      }).
      on('keydown.multiselect', 'a', function(e) {
        switch (e.which) {
          case 27:
            self.close();
            break;
          case 9: // tab
            var $target = $(e.target);
            if ((e.shiftKey
                && !$target.parent().prev().length
                && !self.$header.find('.ui-multiselect-filter').length)
               || (!$target.parent().next().length && !self.$labels.length && !e.shiftKey)) {
              self.close();
              e.preventDefault();
            }
            break;
        }
      });
    },

    /**
     * Allows the widget to be resized if the option is set and resizable is
     * included in jQuery UI
     */
     _setResizable: function() {
       if (!this.options.resizableMenu || !('resizable' in $.ui)) {
         return;
       }
       this.$menu.show();
       this.$menu.resizable({
         containment: 'parent',
         handles: 's',
         helper: 'ui-multiselect-resize',
         stop: function(e, ui) {
           // Force consistent width
           ui.size.width = ui.originalSize.width;
           $(this).outerWidth(ui.originalSize.width);
           if (this._trigger('resize', e, ui) !== false) {
             this.options.menuHeight = ui.size.height;
           }
           this._setMenuHeight(true);
         },
       });
       this.$menu.hide();
     },

    /**
     * Binds all events used in the widget
     * This calls the menu, button, and header event binding methods
     */
    _bindEvents: function() {
      if (!this.options.listbox) {
         this._bindButtonEvents();
      }
      this._bindHeaderEvents();
      this._bindCheckboxEvents();
      this._setResizable();

      // Close each widget when clicking on any other element/anywhere else on the page,
      // another widget instance, or when scrolling w/ the mouse wheel outside the menu button.
      this.document.on('mousedown' + this._namespaceID
                       + ' wheel' + this._namespaceID
                       + ' mousewheel' + this._namespaceID, function(event) {
        var target = event.target;

        if ( this._isOpen
            && (!!this.$button ? target !== this.$button[0] && !$.contains(this.$button[0], target) : true)
            && target !== this.$menu[0] && !$.contains(this.$menu[0], target) ) {
          this.close();
        }
      }.bind(this));

      // deal with form resets.  the problem here is that buttons aren't
      // restored to their defaultValue prop on form reset, and the reset
      // handler fires before the form is actually reset.  delaying it a bit
      // gives the form inputs time to clear.
      $(this.element[0].form).on('reset' + this._namespaceID, function() {
        setTimeout(this.refresh.bind(this), 10);
      }.bind(this));
    },

    /**
     * Sets and caches the width of the button
     * Can set a minimum value if less than calculated width of native select.
     * @param {boolean} recalc true if cached width needs to be re-calculated
     */
    _setButtonWidth: function(recalc) {
      if (this._savedButtonWidth && !recalc) {
         return;
      }

      // this._selectWidth set in _create() for native select element before hiding it.
      var width = this._selectWidth || this._getBCRWidth( this.element );
      var buttonWidth = this.options.buttonWidth || '';
      if (/\d/.test(buttonWidth)) {
         var parsed = parse2px(buttonWidth, this.element);
         var pixels = parsed.px;
         var minimax = parsed.minimax;
         width = minimax < 0 ? Math.max(width, pixels) : ( minimax > 0 ? Math.min(width, pixels) : pixels );
      } else { // keywords
         buttonWidth = buttonWidth.toLowerCase();
      }

      // The button width is set to auto in the CSS,
      // so we only need to change it for a specific width.
      if (buttonWidth !== 'auto') {
         this.$button.outerWidth(width);
      }
      this._savedButtonWidth = width;
    },

    /**
     * Sets and caches the width of the menu
     * Will use the width in options if provided, otherwise matches the button
     * @param {boolean} recalc true if cached width needs to be re-calculated
     */
    _setMenuWidth: function(recalc) {
      if (this._savedMenuWidth && !recalc) {
         return;
      }

      // Note that it is assumed that the button width was set prior.
      var width = !!this.options.listbox ? this._selectWidth : (this._savedButtonWidth || this._getBCRWidth( this.$button ));

      var menuWidth = this.options.menuWidth || '';
      if ( /\d/.test(menuWidth) ) {
         var parsed = parse2px(menuWidth, this.element);
         var pixels = parsed.px;
         var minimax = parsed.minimax;
         width = minimax < 0 ? Math.max(width, pixels) : ( minimax > 0 ? Math.min(width, pixels) : pixels );
      } else { // keywords
         menuWidth = menuWidth.toLowerCase();
      }

      // Note that the menu width defaults to the button width if menuWidth option is null or blank.
      if (menuWidth !== 'auto') {
         this.$menu.outerWidth(width);
         this._savedMenuWidth = width;
         return;
      }

      // Auto width determination: get intrinsic / "shrink-wrapped" outer widths w/ margins by applying floats.
      // cbWidth includes the width of the vertical scrollbar & ui-hover-state width increase per the applied CSS.
      // Note that a correction is made for jQuery floating point round-off errors below.
      this.$menu.addClass('ui-multiselect-measure');
      var headerWidth = this.$header.outerWidth(true) + this._jqWidthFix(this.$header);
      var cbWidth = this.$checkboxes.outerWidth(true) + this._jqWidthFix(this.$checkboxes);
      this.$menu.removeClass('ui-multiselect-measure');

      var contentWidth = Math.max(this.options.wrapText.indexOf('header') > -1 ? 0 : headerWidth, cbWidth);

      // Use $().width() to set menu width not including padding or border.
      this.$menu.width(contentWidth);
      // Save width including padding and border (no margins) for consistency w/ normal width setting.
      this._savedMenuWidth = this.$menu.outerWidth(false);
    },

    /**
     * Sets and caches the height of the menu
     * Will use the height provided in the options unless using the select size
     *  option or the option exceeds the available height for the menu
     * Will set a scrollbar if the options can't all be visible at once
     * @param {boolean} recalc true if cached value needs to be re-calculated
     */
    _setMenuHeight: function(recalc) {
      var self = this;
      if (self._savedMenuHeight && !recalc) {
         return;
      }

      var maxHeight = $(window).height();
      var optionHeight = self.options.menuHeight || '';
      var useSelectSize = false;
      var elSelectSize = 4;

      if ( /\d/.test(optionHeight) ) {
         // Deduct height of header & border/padding to find height available for checkboxes.
         var $header = self.$header.filter(':visible');
         var headerHeight = $header.outerHeight(true);
         var menuBorderPaddingHt = this.$menu.outerHeight(false) - this.$menu.height();
         var cbBorderPaddingHt = this.$checkboxes.outerHeight(false) - this.$checkboxes.height();

         optionHeight = parse2px(optionHeight, self.element, true).px;
         maxHeight = Math.min(optionHeight, maxHeight) - headerHeight - menuBorderPaddingHt - cbBorderPaddingHt;
      } else if (optionHeight.toLowerCase() === 'size') {
         // Overall height based on native select 'size' attribute
         useSelectSize = true;
         // Retrieves native select's size attribute or defaults to 4 (like native select).
         elSelectSize = self.element[0].size || elSelectSize;
      }

      var overflowSetting = 'hidden';
      var itemCount = 0;
      var hoverAdjust = 4; // Adjustment for hover height included here.
      var ulHeight = hoverAdjust;
      var ulTop = -1;

      // The following determines the how many items are visible per the menuHeight option.
      //   If the visible height calculation exceeds the calculated maximum height or if the number
      //   of item heights summed equal or exceed the native select size attribute, the loop is aborted.
      // If the loop is aborted, this means that the menu must be scrolled to see all the items.
      self.$checkboxes.find('li:not(.ui-multiselect-optgroup),a').filter(':visible').each( function() {
        if (ulTop < 0) {
           ulTop = this.offsetTop;
        }
        ulHeight = this.offsetTop + this.offsetHeight - ulTop + hoverAdjust;
        if (useSelectSize && ++itemCount >= elSelectSize || ulHeight > maxHeight) {
          overflowSetting = 'auto';
          if (!useSelectSize) {
            ulHeight = maxHeight;
          }
          return false;
        }
      });

      // We actually only set the height of the checkboxes as the outer menu container is height:auto.
      // The _savedMenuHeight value below can be compared to optionHeight as an accuracy check.
      self.$checkboxes.css('overflow', overflowSetting).height(ulHeight);
      self._savedMenuHeight = this.$menu.outerHeight(false);
    },

    /**
     * Calculate accurate outerWidth(false) using getBoundingClientRect()
     * Note that this presumes that the element is visible in the layout.
     * @param {node} elem DOM node or jQuery equivalent to get width for.
     * @return {float} Decimal floating point value for the width.
     */
   _getBCRWidth: function(elem) {
      if (!elem || !!elem.jquery && !elem[0]) {
         return null;
      }
      var domRect = !!elem.jquery ? elem[0].getBoundingClientRect() : elem.getBoundingClientRect();
      return domRect.right - domRect.left;
    },

    /**
     * Calculate jQuery width correction factor to fix floating point round-off errors.
     * Note that this presumes that the element is visible in the layout.
     * @param {node} elem node or jQuery equivalent to get width for.
     * @return {float} Correction value for the width--typically a decimal < 1.0
     */
    _jqWidthFix: function(elem) {
      if (!elem || !!elem.jquery && !elem[0]) {
         return null;
      }
      return !!elem.jquery
                  ? this._getBCRWidth(elem[0]) - elem.outerWidth(false)
                  : this._getBCRWidth(elem) - $(elem).outerWidth(false);
    },

    /**
     * Moves focus up or down the options list
     * @param {number} which key that triggered the traversal
     * @param {node} start element event was triggered from
     */
    _traverse: function(which, start) {
      var $start = $(start);
      var moveToLast = which === 38 || which === 37;

      // select the first li that isn't an optgroup label / disabled
      var $next = $start.parent()[moveToLast ? 'prevAll' : 'nextAll']('li:not(:disabled, .ui-multiselect-optgroup):visible').first();
      // we might have to jump to the next/previous option group
      if (!$next.length) {
        $next = $start.parents('.ui-multiselect-optgroup')[moveToLast ? 'prev' : 'next']();
      }

      // if at the first/last element
      if (!$next.length) {
        var $container = this.$checkboxes;

        // move to the first/last
        $container.find('label').filter(':visible')[moveToLast ? 'last' : 'first']().trigger('mouseover', {allowScroll: true});

        // set scroll position
        $container.scrollTop(moveToLast ? $container.height() : 0);
      } else {
        $next.find('label').filter(':visible')[moveToLast ? 'last' : 'first']().trigger('mouseover', {allowScroll: true});
      }
    },

    /**
     * Internal function to toggle checked property and related attributes on a checkbox
     * The context of this function should be a checkbox; do not proxy it.
     * @param {string} prop Property being toggled on the checkbox
     * @param {string} flag Flag to set for the property
     * @return {function} function for toggling checked state
     */
    _toggleState: function(prop, flag) {
      return function() {
         var state = (flag === '!') ? !this[prop] : flag;

         if ( !this.disabled ) {
          this[prop] = state;
         }

        if (state) {
          this.setAttribute('aria-' + prop, true);
        } else {
          this.removeAttribute('aria-' + prop);
        }
      };
    },

    /**
     * Toggles the checked state on options within the menu
     * Potentially scoped down to visible elements from filteredInputs
     * @param {boolean} flag checked property to set
     * @param {object} group option group that was clicked, if any
     * @param {boolean} filteredInputs does not toggle hidden inputs if filtering.
     */
    _toggleChecked: function(flag, group, filteredInputs) {
      var self = this;
      var $element = self.element;
      var $inputs = (group && group.length) ? group : self.$inputs;

      if (filteredInputs) {
         $inputs = self._isOpen
                     ? $inputs.closest('li').not('.ui-multiselect-excluded').find('input').not(':disabled')
                     : $inputs.not(':disabled');
      }

      // toggle state on inputs
      $inputs.each(self._toggleState('checked', flag));

      // Give the first input focus
      $inputs.eq(0).focus();

      // update button text
      self.update();

      // Create a plain object of the values that actually changed
      var inputValues = {};
      $inputs.each( function() {
        inputValues[this.value] = true;
      });

      // toggle state on original option tags
      $element.find('option')
              .each( function() {
                if (!this.disabled && inputValues[this.value]) {
                  self._toggleState('selected', flag).call(this);
                }
              });

      // trigger the change event on the select
      if ($inputs.length) {
        $element.trigger('change');
      }
    },

   /**
    * Toggles disabled state on the widget and underlying select or for just one option group.
    * Will also disable all individual options if the disableInputsOnToggle option is set
    * @param {boolean} flag true if disabling widget
    * @param {number | string} groupID index or label of option group to disable
    */
    _toggleDisabled: function(flag, groupID) {
      var disabledClass = 'ui-state-disabled'; // used for styling only

      if (this.$button) {
         this.$button.prop({'disabled': flag, 'aria-disabled': flag})[flag ? 'addClass' : 'removeClass'](disabledClass);
      }

      if (this.options.disableInputsOnToggle) {
         // Apply the ui-multiselect-disabled class name to identify which
         // input elements this widget disabled (not pre-disabled)
         // so that they can be restored if the widget is re-enabled.
         var $inputs = (typeof groupID === 'undefined') ? this.$inputs : this._multiselectOptgroupFilter(groupID).find('input');
               var msDisabledClass = 'ui-multiselect-disabled';
         if (flag) {
            var matchedInputs = $inputs.filter(':enabled').get();
            for (var x = 0, len = matchedInputs.length; x < len; x++) {
               matchedInputs[x].setAttribute('disabled', 'disabled');
               matchedInputs[x].setAttribute('aria-disabled', 'disabled');
               matchedInputs[x].classList.add(msDisabledClass);
               matchedInputs[x].parentNode.classList.add(disabledClass);
             }
         } else {
            var matchedInputs = $inputs.filter('.' + msDisabledClass + ':disabled').get();
            for (var x = 0, len = matchedInputs.length; x < len; x++) {
              matchedInputs[x].removeAttribute('disabled');
              matchedInputs[x].removeAttribute('aria-disabled');
              matchedInputs[x].classList.remove(msDisabledClass);
              matchedInputs[x].parentNode.classList.remove(disabledClass);
            }
         }
      }

      var $select = (typeof groupID === 'undefined') ? this.element : this._nativeOptgroupFilter(groupID).find('option');
      $select.prop({
        'disabled': flag,
        'aria-disabled': flag,
      });
    },

    /**
     * Opens the menu, possibly with effects
     * Calls methods to set position and resize as well
     */
    open: function() {
      var $button = this.$button;

      // bail if the multiselect open event returns false, this widget is disabled, or is already open
      if (this._trigger('beforeopen') === false || $button.hasClass('ui-state-disabled') || this._isOpen || !!this.options.listbox) {
        return;
      }

      var $menu = this.$menu;
      var $header = this.$header;
      var $labels = this.$labels;
      var $inputs = this.$inputs.filter(':checked:not(.ui-state-disabled)');
      var options = this.options;
      var effect = options.openEffect;
      var scrollX = window.pageXOffset;
      var scrollY = window.pageYOffset;

      // set the scroll of the checkbox container
      this.$checkboxes.scrollTop(0);

      // Show the menu, set its dimensions, and position it.
      $menu.css('display', 'block');
      this._setMenuWidth();
      this._setMenuHeight();
      this.position();

      // Do any specified open animation effect after positioning the menu.
      if (!!effect) {
         // Menu must be hidden for some effects (e.g. fade) to work.
         $menu.css('display', 'none');
         if (typeof effect == 'string') {
            $menu.show(effect, this.speed);
         } else if (typeof effect == 'object' && effect.constructor == Array) {
            $menu.show(effect[0], effect[1] || this.speed);
         } else if (typeof effect == 'object' && effect.constructor == Object) {
            $menu.show(effect);
         }
      }

      // focus the first not disabled option or filter input if available
      var filter = $header.find('.ui-multiselect-filter');
      if (filter.length) {
        filter.first().find('input').trigger('focus');
      } else if ($inputs.length) {
         $inputs.eq(0).trigger('focus').parent('label').eq(0).trigger('mouseover').trigger('mouseenter');
      } else if ($labels.length) {
        $labels.filter(':not(.ui-state-disabled)').eq(0).trigger('mouseover').trigger('mouseenter').find('input').trigger('focus');
      } else {
        $header.find('a').first().trigger('focus');
      }

      // Restore window scroll position if altered by setting element focus
      window.scrollTo(scrollX, scrollY);

      $button.addClass('ui-state-active');
      this._isOpen = true;
      this._trigger('open');
    },

    // Close the menu
    close: function() {
      // bail if the multiselect close event returns false
      if (this._trigger('beforeclose') === false || !!this.options.listbox) {
        return;
      }

      var $menu = this.$menu;
      var options = this.options;
      var effect = options.closeEffect;
      var $button = this.$button;

      // hide the menu, maybe with a speed/effect combo
      if (!!effect) {
         if (typeof effect == 'string') {
            $menu.hide(effect, this.speed);
         } else if (typeof effect == 'object' && effect.constructor == Array) {
            $menu.hide(effect[0], effect[1] || this.speed);
         } else if (typeof effect == 'object' && effect.constructor == Object) {
            $menu.hide(effect);
         }
      } else {
         $menu.css('display', 'none');
      }

      $button.removeClass('ui-state-active').trigger('blur').trigger('mouseleave');
      this.element.trigger('blur'); // For jQuery Validate
      this._isOpen = false;
      this._trigger('close');
      $button.trigger('focus');
    },

    /**
     * Positions the menu relative to the button.
     */
    position: function() {
      var $button = this.$button;

      // Save the button height so that we can determine when it has changed due to adding/removing selections.
      this._savedButtonHeight = $button.outerHeight(false);

      if ($.ui && $.ui.position) {
        this.$menu.position(this.options.position);
      } else {
        var pos = {};

        pos.top = $button.offset().top + this._savedButtonHeight;
        pos.left = $button.offset().left;

        this.$menu.offset(pos);
      }
    },

    // Enable widget
    enable: function(groupID) {
      this._toggleDisabled(false, groupID);
    },

    // Disable widget
    disable: function(groupID) {
      this._toggleDisabled(true, groupID);
    },

    /**
    * Checks all options or those in an option group
    * Accounts for maxSelected possibly being set.
    * @param {(number|string)} groupID index or label of option group to check all for.
    */
    checkAll: function(groupID) {
      this._trigger('beforeCheckAll');

      if (this.options.maxSelected) {
         return;
      }

      if (typeof groupID === 'undefined') { // groupID could be 0
         this._toggleChecked(true);
      } else {
         this._toggleChecked(true, this._multiselectOptgroupFilter(groupID).find('input'));
      }

      this._trigger('checkAll');
    },

    /**
    * Unchecks all options or those in an option group
    * @param {(number|string)} groupID index or label of option group to uncheck all for.
    */
    uncheckAll: function(groupID) {
      this._trigger('beforeUncheckAll');

      if (typeof groupID === 'undefined') { // groupID could be 0
         this._toggleChecked(false);
      } else {
         this._toggleChecked(false, this._multiselectOptgroupFilter(groupID).find('input'));
      }
      if ( !this.element[0].multiple && !this.$inputs.filter(':checked').length) {
        // Forces the underlying single-select to have no options selected.
        this.element[0].selectedIndex = -1;
      }

      this._trigger('uncheckAll');
    },

    /**
    * Flips all options or those in an option group.
    * Accounts for maxSelected possibly being set.
    * @param {(number|string)} groupID index or label of option group to flip all for.
    */
    flipAll: function(groupID) {
      this._trigger('beforeFlipAll');

      var gotID = (typeof groupID !== 'undefined'); // groupID could be 0
      var maxSelected = this.options.maxSelected;
      var inputCount = this.$inputs.length;
      var checkedCount = this.$inputs.filter(':checked').length;
      var $filteredOptgroupInputs = gotID ? this._multiselectOptgroupFilter(groupID).find('input') : null;
      var gInputCount = gotID ? $filteredOptgroupInputs.length : 0;
      var gCheckedCount = gotID ? $filteredOptgroupInputs.filter(':checked').length : 0;

      if (!maxSelected
          || maxSelected >= (gotID ? checkedCount - gCheckedCount + gInputCount - gCheckedCount : inputCount - checkedCount ) ) {
         if (gotID) {
            this._toggleChecked('!', $filteredOptgroupInputs);
         } else {
            this._toggleChecked('!');
         }
         this._trigger('flipAll');
      } else {
         this.buttonMessage('<center><b>Flip All Not Permitted.</b></center>');
      }
    },

    /**
    * Collapses all option groups or just the one specified.
    * @param {(number|string)} groupID index or label of option group to collapse.
    */
    collapseAll: function(groupID) {
      this._trigger('beforeCollapseAll');

      var $optgroups = (typeof groupID === 'undefined') // groupID could be 0
                              ? this.$checkboxes.find('.ui-multiselect-optgroup')
                              : this._multiselectOptgroupFilter(groupID);

      $optgroups.addClass('ui-multiselect-collapsed')
                     .children('.ui-multiselect-collapser').attr('title', this.linkInfo.expand.title ).html( this.linkInfo.expand.icon );

      this._trigger('collapseAll');
    },

    /**
    * Expands all option groups or just the one specified.
    * @param {(number|string)} groupID index or label of option group to expand.
    */
    expandAll: function(groupID) {
      this._trigger('beforeExpandAll');

      var $optgroups = (typeof groupID === 'undefined') // groupID could be 0
                              ? this.$checkboxes.find('.ui-multiselect-optgroup')
                              : this._multiselectOptgroupFilter(groupID);

      $optgroups.removeClass('ui-multiselect-collapsed')
                     .children('.ui-multiselect-collapser').attr('title', this.linkInfo.collapse.title ).html( this.linkInfo.collapse.icon );

      this._trigger('expandAll');
    },

    /**
     * Flashes a message in the button caption for 1 second.
     * Useful for very short warning messages to the user.
     * @param {string} message HTML to show in the button.
     */
    buttonMessage: function(message) {
       var self = this;
       self.$buttonlabel.html(message);
       setTimeout( function() {
         self.update();
       }, 1000 );
    },

    /**
     * Provides a list of all checked options
     * @return {array} list of inputs
     */
    getChecked: function() {
      return this.$inputs.filter(':checked');
    },

    /**
     * Provides a list of all options that are not checked
     * @return {array} list of inputs
     */
    getUnchecked: function() {
      return this.$inputs.filter(':not(:checked)');
    },

    /**
     * Destroys the widget instance
     * @return {object} reference to widget
     */
    destroy: function() {
      // remove classes + data
      $.Widget.prototype.destroy.call(this);

      // unbind events
      this.document.off(this._namespaceID);
      $(this.element[0].form).off(this._namespaceID);

      if (!this.options.listbox) {
         this.$button.remove();
      }
      this.$menu.remove();
      this.element.show();

      return this;
    },

    /**
     * @return {boolean} indicates whether the menu is open
     */
    isOpen: function() {
      return this._isOpen;
    },

    /**
     * @return {object} jQuery object for menu
     */
    widget: function() {
      return this.$menu;
    },

    /**
     * @return {string} namespaceID for use with external event handlers.
     */
    getNamespaceID: function() {
      return this._namespaceID;
    },

    /**
     * @return {object} jQuery object for button
     */
    getButton: function() {
      return this.$button;
    },

    /**
     * Essentially an alias for widget
     * @return {object} jQuery object for menu
     */
    getMenu: function() {
      return this.$menu;
    },

    /**
     * @return {array} List of the option labels
     */
    getLabels: function() {
      return this.$labels;
    },

    /**
     * @return {array} List of option groups that are collapsed
     */
    getCollapsed: function() {
       return this.$checkboxes.find('.ui-multiselect-collapsed');
    },

    /**
    * Sets the value of the underlying select then resyncs the menu.
    * @param {(string|array)} newValue value(s) to set the underlying select to.
    * @return {any} the underlying select when a value is provied, or eles the value of the select
     */
    value: function(newValue) {
      if (typeof newValue !== 'undefined') {
         this.element.val(newValue);
         this.resync();
         return this.element;
      } else {
         return this.element.val();
      }
    },

    /**
     * Determines if HTML content is allowed for the given element type
     * @param {string} element to check
     * @return {boolean} true if html content is allowed
     */
    htmlAllowedFor: function(element) {
      return this.options.htmlText.indexOf(element) > -1;
    },

    /**
    * Adds an option to the widget and underlying select
    * @param {object} attributes hash to be added to the option
    * @param {string} text label for the option
    * @param {(number|string)} groupID index or label of option group to add the option to
    */
    addOption: function(attributes, text, groupID) {
      var self = this;
      var textFxn = self.htmlAllowedFor('options') ? 'html' : 'text';
      var $option = $( document.createElement('option') ).attr(attributes)[textFxn](text);
      var optionNode = $option.get(0);

      if (typeof groupID === 'undefined') { // groupID could be 0
         self.element.append($option);
         self.$checkboxes.append(self._makeOption(optionNode));
      } else {
         self._nativeOptgroupFilter(groupID).append($option);
         self._multiselectOptgroupFilter(groupID).append(self._makeOption(optionNode));
      }

      self._updateCache();
    },

    /**
    * Finds an optgroup in the native select by index or label using the tag name
    * @param {(number|string)} groupID index or label of option group to find
    * @return {object} matching option groups
    */
    _nativeOptgroupFilter: function(groupID) {
       return this.element.children('OPTGROUP').filter( function(index) {
          return (typeof groupID === 'number' ? index === groupID : this.getAttribute('label') === groupID);
       });
    },

    /**
    * Finds an optgroup in the multiselect widget by index or label
    * @param {(number|string)} groupID index or label of option group to find
    * @return {object} matching option groups
    */
    _multiselectOptgroupFilter: function(groupID) {
       return this.$menu.find('.ui-multiselect-optgroup').filter( function(index) {
          return (typeof groupID === 'number' ? index === groupID : this.getElementsByClassName('ui-multiselect-grouplabel')[0].textContent === groupID);
       });
    },

    /**
     * Removes an option from the widget and underlying select
     * @param {string} value attribute corresponding to option being removed
     */
    removeOption: function(value) {
      if (!value) {
        return;
      }
      this.element.find('option[value=' + value + ']').remove();
      this.$labels.find('input[value=' + value + ']').parents('li').remove();

      this._updateCache();
    },

    /**
     * Reacts to options being changed
     * Delegates to various handlers
     * @param {string} key into the options hash
     * @param {any} value to be assigned to that option
     */
    _setOption: function(key, value) {
      var $header = this.$header;
      var $menu = this.$menu;

      switch (key) {
        case 'header':
          if (typeof value === 'boolean') {
            $header.toggle( value );
          } else if (typeof value === 'string') {
            this.$headerLinkContainer.children('li:not(:last-child)').remove();
            this.$headerLinkContainer.prepend('<li>' + value + '</li>');
          }
          break;
        case 'checkAllText':
        case 'uncheckAllText':
        case 'flipAllText':
        case 'collapseAllText':
        case 'expandAllText':
          if (key !== 'checkAllText' || !this.options.maxSelected) {
            // eq(-1) finds the last span
            $header.find('a.' + this.linkInfo[key.replace('Text', '')]['class'] + ' span').eq(-1).html(value);
          }
          break;
        case 'checkAllIcon':
        case 'uncheckAllIcon':
        case 'flipAllIcon':
        case 'collapseAllIcon':
        case 'expandAllIcon':
          if (key !== 'checkAllIcon' || !this.options.maxSelected) {
            // eq(0) finds the first span
            $header.find('a.' + this.linkInfo[key.replace('Icon', '')]['class'] + ' span').eq(0).replaceWith(value);
          }
          break;
        case 'openIcon':
          $menu.find('span.ui-multiselect-open').html(value);
          break;
        case 'closeIcon':
          $menu.find('a.ui-multiselect-close').html(value);
          break;
        case 'buttonWidth':
        case 'menuWidth':
          this.options[key] = value;
          this._setButtonWidth(true); // true forces recalc of cached value.
          this._setMenuWidth(true); // true forces recalc of cached value.
          break;
        case 'menuHeight':
          this.options[key] = value;
          this._setMenuHeight(true); // true forces recalc of cached value.
          break;
        case 'selectedText':
        case 'selectedList':
        case 'maxSelected':
        case 'noneSelectedText':
        case 'selectedListSeparator':
          this.options[key] = value; // these all need to update immediately for the update() call
          this.update(true);
          break;
        case 'classes':
          $menu.add(this.$button).removeClass(this.options.classes).addClass(value);
          break;
        case 'multiple':
          var $element = this.element;
          if (!!$element[0].multiple !== value) {
             $menu.toggleClass('ui-multiselect-multiple', value).toggleClass('ui-multiselect-single', !value);
             $element[0].multiple = value;
             this.uncheckAll();
             this.refresh();
          }
          break;
       case 'position':
         if (value !== null && !$.isEmptyObject(value) ) {
            this.options.position = value;
         }
         this.position();
         break;
       case 'zIndex':
         this.options.zIndex = value;
         this.$menu.css('z-index', value);
         break;
      default:
         this.options[key] = value;
     }
     $.Widget.prototype._setOption.apply(this, arguments); // eslint-disable-line prefer-rest-params
   },
   _parse2px: parse2px,

  });

   // Fix for jQuery UI modal dialogs
   // https://api.jqueryui.com/dialog/#method-_allowInteraction
   // https://learn.jquery.com/jquery-ui/widget-factory/extending-widgets/
   if ($.ui && 'dialog' in $.ui) {
      $.widget( 'ui.dialog', $.ui.dialog, {
         _allowInteraction: function( event ) {
             if ( this._super( event ) || $( event.target ).closest('.ui-multiselect-menu' ).length ) {
               return true;
             }
         },
      });
   }
})(jQuery);

/*! jQuery v3.5.1 | (c) JS Foundation and other contributors | jquery.org/license */
!function(e,t){"use strict";"object"==typeof module&&"object"==typeof module.exports?module.exports=e.document?t(e,!0):function(e){if(!e.document)throw new Error("jQuery requires a window with a document");return t(e)}:t(e)}("undefined"!=typeof window?window:this,function(C,e){"use strict";var t=[],r=Object.getPrototypeOf,s=t.slice,g=t.flat?function(e){return t.flat.call(e)}:function(e){return t.concat.apply([],e)},u=t.push,i=t.indexOf,n={},o=n.toString,v=n.hasOwnProperty,a=v.toString,l=a.call(Object),y={},m=function(e){return"function"==typeof e&&"number"!=typeof e.nodeType},x=function(e){return null!=e&&e===e.window},E=C.document,c={type:!0,src:!0,nonce:!0,noModule:!0};function b(e,t,n){var r,i,o=(n=n||E).createElement("script");if(o.text=e,t)for(r in c)(i=t[r]||t.getAttribute&&t.getAttribute(r))&&o.setAttribute(r,i);n.head.appendChild(o).parentNode.removeChild(o)}function w(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?n[o.call(e)]||"object":typeof e}var f="3.5.1",S=function(e,t){return new S.fn.init(e,t)};function p(e){var t=!!e&&"length"in e&&e.length,n=w(e);return!m(e)&&!x(e)&&("array"===n||0===t||"number"==typeof t&&0<t&&t-1 in e)}S.fn=S.prototype={jquery:f,constructor:S,length:0,toArray:function(){return s.call(this)},get:function(e){return null==e?s.call(this):e<0?this[e+this.length]:this[e]},pushStack:function(e){var t=S.merge(this.constructor(),e);return t.prevObject=this,t},each:function(e){return S.each(this,e)},map:function(n){return this.pushStack(S.map(this,function(e,t){return n.call(e,t,e)}))},slice:function(){return this.pushStack(s.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},even:function(){return this.pushStack(S.grep(this,function(e,t){return(t+1)%2}))},odd:function(){return this.pushStack(S.grep(this,function(e,t){return t%2}))},eq:function(e){var t=this.length,n=+e+(e<0?t:0);return this.pushStack(0<=n&&n<t?[this[n]]:[])},end:function(){return this.prevObject||this.constructor()},push:u,sort:t.sort,splice:t.splice},S.extend=S.fn.extend=function(){var e,t,n,r,i,o,a=arguments[0]||{},s=1,u=arguments.length,l=!1;for("boolean"==typeof a&&(l=a,a=arguments[s]||{},s++),"object"==typeof a||m(a)||(a={}),s===u&&(a=this,s--);s<u;s++)if(null!=(e=arguments[s]))for(t in e)r=e[t],"__proto__"!==t&&a!==r&&(l&&r&&(S.isPlainObject(r)||(i=Array.isArray(r)))?(n=a[t],o=i&&!Array.isArray(n)?[]:i||S.isPlainObject(n)?n:{},i=!1,a[t]=S.extend(l,o,r)):void 0!==r&&(a[t]=r));return a},S.extend({expando:"jQuery"+(f+Math.random()).replace(/\D/g,""),isReady:!0,error:function(e){throw new Error(e)},noop:function(){},isPlainObject:function(e){var t,n;return!(!e||"[object Object]"!==o.call(e))&&(!(t=r(e))||"function"==typeof(n=v.call(t,"constructor")&&t.constructor)&&a.call(n)===l)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},globalEval:function(e,t,n){b(e,{nonce:t&&t.nonce},n)},each:function(e,t){var n,r=0;if(p(e)){for(n=e.length;r<n;r++)if(!1===t.call(e[r],r,e[r]))break}else for(r in e)if(!1===t.call(e[r],r,e[r]))break;return e},makeArray:function(e,t){var n=t||[];return null!=e&&(p(Object(e))?S.merge(n,"string"==typeof e?[e]:e):u.call(n,e)),n},inArray:function(e,t,n){return null==t?-1:i.call(t,e,n)},merge:function(e,t){for(var n=+t.length,r=0,i=e.length;r<n;r++)e[i++]=t[r];return e.length=i,e},grep:function(e,t,n){for(var r=[],i=0,o=e.length,a=!n;i<o;i++)!t(e[i],i)!==a&&r.push(e[i]);return r},map:function(e,t,n){var r,i,o=0,a=[];if(p(e))for(r=e.length;o<r;o++)null!=(i=t(e[o],o,n))&&a.push(i);else for(o in e)null!=(i=t(e[o],o,n))&&a.push(i);return g(a)},guid:1,support:y}),"function"==typeof Symbol&&(S.fn[Symbol.iterator]=t[Symbol.iterator]),S.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(e,t){n["[object "+t+"]"]=t.toLowerCase()});var d=function(n){var e,d,b,o,i,h,f,g,w,u,l,T,C,a,E,v,s,c,y,S="sizzle"+1*new Date,p=n.document,k=0,r=0,m=ue(),x=ue(),A=ue(),N=ue(),D=function(e,t){return e===t&&(l=!0),0},j={}.hasOwnProperty,t=[],q=t.pop,L=t.push,H=t.push,O=t.slice,P=function(e,t){for(var n=0,r=e.length;n<r;n++)if(e[n]===t)return n;return-1},R="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",M="[\\x20\\t\\r\\n\\f]",I="(?:\\\\[\\da-fA-F]{1,6}"+M+"?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+",W="\\["+M+"*("+I+")(?:"+M+"*([*^$|!~]?=)"+M+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+I+"))|)"+M+"*\\]",F=":("+I+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+W+")*)|.*)\\)|)",B=new RegExp(M+"+","g"),$=new RegExp("^"+M+"+|((?:^|[^\\\\])(?:\\\\.)*)"+M+"+$","g"),_=new RegExp("^"+M+"*,"+M+"*"),z=new RegExp("^"+M+"*([>+~]|"+M+")"+M+"*"),U=new RegExp(M+"|>"),X=new RegExp(F),V=new RegExp("^"+I+"$"),G={ID:new RegExp("^#("+I+")"),CLASS:new RegExp("^\\.("+I+")"),TAG:new RegExp("^("+I+"|[*])"),ATTR:new RegExp("^"+W),PSEUDO:new RegExp("^"+F),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+M+"*(even|odd|(([+-]|)(\\d*)n|)"+M+"*(?:([+-]|)"+M+"*(\\d+)|))"+M+"*\\)|)","i"),bool:new RegExp("^(?:"+R+")$","i"),needsContext:new RegExp("^"+M+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+M+"*((?:-\\d)?\\d*)"+M+"*\\)|)(?=[^-]|$)","i")},Y=/HTML$/i,Q=/^(?:input|select|textarea|button)$/i,J=/^h\d$/i,K=/^[^{]+\{\s*\[native \w/,Z=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,ee=/[+~]/,te=new RegExp("\\\\[\\da-fA-F]{1,6}"+M+"?|\\\\([^\\r\\n\\f])","g"),ne=function(e,t){var n="0x"+e.slice(1)-65536;return t||(n<0?String.fromCharCode(n+65536):String.fromCharCode(n>>10|55296,1023&n|56320))},re=/([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,ie=function(e,t){return t?"\0"===e?"\ufffd":e.slice(0,-1)+"\\"+e.charCodeAt(e.length-1).toString(16)+" ":"\\"+e},oe=function(){T()},ae=be(function(e){return!0===e.disabled&&"fieldset"===e.nodeName.toLowerCase()},{dir:"parentNode",next:"legend"});try{H.apply(t=O.call(p.childNodes),p.childNodes),t[p.childNodes.length].nodeType}catch(e){H={apply:t.length?function(e,t){L.apply(e,O.call(t))}:function(e,t){var n=e.length,r=0;while(e[n++]=t[r++]);e.length=n-1}}}function se(t,e,n,r){var i,o,a,s,u,l,c,f=e&&e.ownerDocument,p=e?e.nodeType:9;if(n=n||[],"string"!=typeof t||!t||1!==p&&9!==p&&11!==p)return n;if(!r&&(T(e),e=e||C,E)){if(11!==p&&(u=Z.exec(t)))if(i=u[1]){if(9===p){if(!(a=e.getElementById(i)))return n;if(a.id===i)return n.push(a),n}else if(f&&(a=f.getElementById(i))&&y(e,a)&&a.id===i)return n.push(a),n}else{if(u[2])return H.apply(n,e.getElementsByTagName(t)),n;if((i=u[3])&&d.getElementsByClassName&&e.getElementsByClassName)return H.apply(n,e.getElementsByClassName(i)),n}if(d.qsa&&!N[t+" "]&&(!v||!v.test(t))&&(1!==p||"object"!==e.nodeName.toLowerCase())){if(c=t,f=e,1===p&&(U.test(t)||z.test(t))){(f=ee.test(t)&&ye(e.parentNode)||e)===e&&d.scope||((s=e.getAttribute("id"))?s=s.replace(re,ie):e.setAttribute("id",s=S)),o=(l=h(t)).length;while(o--)l[o]=(s?"#"+s:":scope")+" "+xe(l[o]);c=l.join(",")}try{return H.apply(n,f.querySelectorAll(c)),n}catch(e){N(t,!0)}finally{s===S&&e.removeAttribute("id")}}}return g(t.replace($,"$1"),e,n,r)}function ue(){var r=[];return function e(t,n){return r.push(t+" ")>b.cacheLength&&delete e[r.shift()],e[t+" "]=n}}function le(e){return e[S]=!0,e}function ce(e){var t=C.createElement("fieldset");try{return!!e(t)}catch(e){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function fe(e,t){var n=e.split("|"),r=n.length;while(r--)b.attrHandle[n[r]]=t}function pe(e,t){var n=t&&e,r=n&&1===e.nodeType&&1===t.nodeType&&e.sourceIndex-t.sourceIndex;if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function de(t){return function(e){return"input"===e.nodeName.toLowerCase()&&e.type===t}}function he(n){return function(e){var t=e.nodeName.toLowerCase();return("input"===t||"button"===t)&&e.type===n}}function ge(t){return function(e){return"form"in e?e.parentNode&&!1===e.disabled?"label"in e?"label"in e.parentNode?e.parentNode.disabled===t:e.disabled===t:e.isDisabled===t||e.isDisabled!==!t&&ae(e)===t:e.disabled===t:"label"in e&&e.disabled===t}}function ve(a){return le(function(o){return o=+o,le(function(e,t){var n,r=a([],e.length,o),i=r.length;while(i--)e[n=r[i]]&&(e[n]=!(t[n]=e[n]))})})}function ye(e){return e&&"undefined"!=typeof e.getElementsByTagName&&e}for(e in d=se.support={},i=se.isXML=function(e){var t=e.namespaceURI,n=(e.ownerDocument||e).documentElement;return!Y.test(t||n&&n.nodeName||"HTML")},T=se.setDocument=function(e){var t,n,r=e?e.ownerDocument||e:p;return r!=C&&9===r.nodeType&&r.documentElement&&(a=(C=r).documentElement,E=!i(C),p!=C&&(n=C.defaultView)&&n.top!==n&&(n.addEventListener?n.addEventListener("unload",oe,!1):n.attachEvent&&n.attachEvent("onunload",oe)),d.scope=ce(function(e){return a.appendChild(e).appendChild(C.createElement("div")),"undefined"!=typeof e.querySelectorAll&&!e.querySelectorAll(":scope fieldset div").length}),d.attributes=ce(function(e){return e.className="i",!e.getAttribute("className")}),d.getElementsByTagName=ce(function(e){return e.appendChild(C.createComment("")),!e.getElementsByTagName("*").length}),d.getElementsByClassName=K.test(C.getElementsByClassName),d.getById=ce(function(e){return a.appendChild(e).id=S,!C.getElementsByName||!C.getElementsByName(S).length}),d.getById?(b.filter.ID=function(e){var t=e.replace(te,ne);return function(e){return e.getAttribute("id")===t}},b.find.ID=function(e,t){if("undefined"!=typeof t.getElementById&&E){var n=t.getElementById(e);return n?[n]:[]}}):(b.filter.ID=function(e){var n=e.replace(te,ne);return function(e){var t="undefined"!=typeof e.getAttributeNode&&e.getAttributeNode("id");return t&&t.value===n}},b.find.ID=function(e,t){if("undefined"!=typeof t.getElementById&&E){var n,r,i,o=t.getElementById(e);if(o){if((n=o.getAttributeNode("id"))&&n.value===e)return[o];i=t.getElementsByName(e),r=0;while(o=i[r++])if((n=o.getAttributeNode("id"))&&n.value===e)return[o]}return[]}}),b.find.TAG=d.getElementsByTagName?function(e,t){return"undefined"!=typeof t.getElementsByTagName?t.getElementsByTagName(e):d.qsa?t.querySelectorAll(e):void 0}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},b.find.CLASS=d.getElementsByClassName&&function(e,t){if("undefined"!=typeof t.getElementsByClassName&&E)return t.getElementsByClassName(e)},s=[],v=[],(d.qsa=K.test(C.querySelectorAll))&&(ce(function(e){var t;a.appendChild(e).innerHTML="<a id='"+S+"'></a><select id='"+S+"-\r\\' msallowcapture=''><option selected=''></option></select>",e.querySelectorAll("[msallowcapture^='']").length&&v.push("[*^$]="+M+"*(?:''|\"\")"),e.querySelectorAll("[selected]").length||v.push("\\["+M+"*(?:value|"+R+")"),e.querySelectorAll("[id~="+S+"-]").length||v.push("~="),(t=C.createElement("input")).setAttribute("name",""),e.appendChild(t),e.querySelectorAll("[name='']").length||v.push("\\["+M+"*name"+M+"*="+M+"*(?:''|\"\")"),e.querySelectorAll(":checked").length||v.push(":checked"),e.querySelectorAll("a#"+S+"+*").length||v.push(".#.+[+~]"),e.querySelectorAll("\\\f"),v.push("[\\r\\n\\f]")}),ce(function(e){e.innerHTML="<a href='' disabled='disabled'></a><select disabled='disabled'><option/></select>";var t=C.createElement("input");t.setAttribute("type","hidden"),e.appendChild(t).setAttribute("name","D"),e.querySelectorAll("[name=d]").length&&v.push("name"+M+"*[*^$|!~]?="),2!==e.querySelectorAll(":enabled").length&&v.push(":enabled",":disabled"),a.appendChild(e).disabled=!0,2!==e.querySelectorAll(":disabled").length&&v.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),v.push(",.*:")})),(d.matchesSelector=K.test(c=a.matches||a.webkitMatchesSelector||a.mozMatchesSelector||a.oMatchesSelector||a.msMatchesSelector))&&ce(function(e){d.disconnectedMatch=c.call(e,"*"),c.call(e,"[s!='']:x"),s.push("!=",F)}),v=v.length&&new RegExp(v.join("|")),s=s.length&&new RegExp(s.join("|")),t=K.test(a.compareDocumentPosition),y=t||K.test(a.contains)?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},D=t?function(e,t){if(e===t)return l=!0,0;var n=!e.compareDocumentPosition-!t.compareDocumentPosition;return n||(1&(n=(e.ownerDocument||e)==(t.ownerDocument||t)?e.compareDocumentPosition(t):1)||!d.sortDetached&&t.compareDocumentPosition(e)===n?e==C||e.ownerDocument==p&&y(p,e)?-1:t==C||t.ownerDocument==p&&y(p,t)?1:u?P(u,e)-P(u,t):0:4&n?-1:1)}:function(e,t){if(e===t)return l=!0,0;var n,r=0,i=e.parentNode,o=t.parentNode,a=[e],s=[t];if(!i||!o)return e==C?-1:t==C?1:i?-1:o?1:u?P(u,e)-P(u,t):0;if(i===o)return pe(e,t);n=e;while(n=n.parentNode)a.unshift(n);n=t;while(n=n.parentNode)s.unshift(n);while(a[r]===s[r])r++;return r?pe(a[r],s[r]):a[r]==p?-1:s[r]==p?1:0}),C},se.matches=function(e,t){return se(e,null,null,t)},se.matchesSelector=function(e,t){if(T(e),d.matchesSelector&&E&&!N[t+" "]&&(!s||!s.test(t))&&(!v||!v.test(t)))try{var n=c.call(e,t);if(n||d.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(e){N(t,!0)}return 0<se(t,C,null,[e]).length},se.contains=function(e,t){return(e.ownerDocument||e)!=C&&T(e),y(e,t)},se.attr=function(e,t){(e.ownerDocument||e)!=C&&T(e);var n=b.attrHandle[t.toLowerCase()],r=n&&j.call(b.attrHandle,t.toLowerCase())?n(e,t,!E):void 0;return void 0!==r?r:d.attributes||!E?e.getAttribute(t):(r=e.getAttributeNode(t))&&r.specified?r.value:null},se.escape=function(e){return(e+"").replace(re,ie)},se.error=function(e){throw new Error("Syntax error, unrecognized expression: "+e)},se.uniqueSort=function(e){var t,n=[],r=0,i=0;if(l=!d.detectDuplicates,u=!d.sortStable&&e.slice(0),e.sort(D),l){while(t=e[i++])t===e[i]&&(r=n.push(i));while(r--)e.splice(n[r],1)}return u=null,e},o=se.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=o(e)}else if(3===i||4===i)return e.nodeValue}else while(t=e[r++])n+=o(t);return n},(b=se.selectors={cacheLength:50,createPseudo:le,match:G,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(te,ne),e[3]=(e[3]||e[4]||e[5]||"").replace(te,ne),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||se.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&se.error(e[0]),e},PSEUDO:function(e){var t,n=!e[6]&&e[2];return G.CHILD.test(e[0])?null:(e[3]?e[2]=e[4]||e[5]||"":n&&X.test(n)&&(t=h(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(te,ne).toLowerCase();return"*"===e?function(){return!0}:function(e){return e.nodeName&&e.nodeName.toLowerCase()===t}},CLASS:function(e){var t=m[e+" "];return t||(t=new RegExp("(^|"+M+")"+e+"("+M+"|$)"))&&m(e,function(e){return t.test("string"==typeof e.className&&e.className||"undefined"!=typeof e.getAttribute&&e.getAttribute("class")||"")})},ATTR:function(n,r,i){return function(e){var t=se.attr(e,n);return null==t?"!="===r:!r||(t+="","="===r?t===i:"!="===r?t!==i:"^="===r?i&&0===t.indexOf(i):"*="===r?i&&-1<t.indexOf(i):"$="===r?i&&t.slice(-i.length)===i:"~="===r?-1<(" "+t.replace(B," ")+" ").indexOf(i):"|="===r&&(t===i||t.slice(0,i.length+1)===i+"-"))}},CHILD:function(h,e,t,g,v){var y="nth"!==h.slice(0,3),m="last"!==h.slice(-4),x="of-type"===e;return 1===g&&0===v?function(e){return!!e.parentNode}:function(e,t,n){var r,i,o,a,s,u,l=y!==m?"nextSibling":"previousSibling",c=e.parentNode,f=x&&e.nodeName.toLowerCase(),p=!n&&!x,d=!1;if(c){if(y){while(l){a=e;while(a=a[l])if(x?a.nodeName.toLowerCase()===f:1===a.nodeType)return!1;u=l="only"===h&&!u&&"nextSibling"}return!0}if(u=[m?c.firstChild:c.lastChild],m&&p){d=(s=(r=(i=(o=(a=c)[S]||(a[S]={}))[a.uniqueID]||(o[a.uniqueID]={}))[h]||[])[0]===k&&r[1])&&r[2],a=s&&c.childNodes[s];while(a=++s&&a&&a[l]||(d=s=0)||u.pop())if(1===a.nodeType&&++d&&a===e){i[h]=[k,s,d];break}}else if(p&&(d=s=(r=(i=(o=(a=e)[S]||(a[S]={}))[a.uniqueID]||(o[a.uniqueID]={}))[h]||[])[0]===k&&r[1]),!1===d)while(a=++s&&a&&a[l]||(d=s=0)||u.pop())if((x?a.nodeName.toLowerCase()===f:1===a.nodeType)&&++d&&(p&&((i=(o=a[S]||(a[S]={}))[a.uniqueID]||(o[a.uniqueID]={}))[h]=[k,d]),a===e))break;return(d-=v)===g||d%g==0&&0<=d/g}}},PSEUDO:function(e,o){var t,a=b.pseudos[e]||b.setFilters[e.toLowerCase()]||se.error("unsupported pseudo: "+e);return a[S]?a(o):1<a.length?(t=[e,e,"",o],b.setFilters.hasOwnProperty(e.toLowerCase())?le(function(e,t){var n,r=a(e,o),i=r.length;while(i--)e[n=P(e,r[i])]=!(t[n]=r[i])}):function(e){return a(e,0,t)}):a}},pseudos:{not:le(function(e){var r=[],i=[],s=f(e.replace($,"$1"));return s[S]?le(function(e,t,n,r){var i,o=s(e,null,r,[]),a=e.length;while(a--)(i=o[a])&&(e[a]=!(t[a]=i))}):function(e,t,n){return r[0]=e,s(r,null,n,i),r[0]=null,!i.pop()}}),has:le(function(t){return function(e){return 0<se(t,e).length}}),contains:le(function(t){return t=t.replace(te,ne),function(e){return-1<(e.textContent||o(e)).indexOf(t)}}),lang:le(function(n){return V.test(n||"")||se.error("unsupported lang: "+n),n=n.replace(te,ne).toLowerCase(),function(e){var t;do{if(t=E?e.lang:e.getAttribute("xml:lang")||e.getAttribute("lang"))return(t=t.toLowerCase())===n||0===t.indexOf(n+"-")}while((e=e.parentNode)&&1===e.nodeType);return!1}}),target:function(e){var t=n.location&&n.location.hash;return t&&t.slice(1)===e.id},root:function(e){return e===a},focus:function(e){return e===C.activeElement&&(!C.hasFocus||C.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:ge(!1),disabled:ge(!0),checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,!0===e.selected},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeType<6)return!1;return!0},parent:function(e){return!b.pseudos.empty(e)},header:function(e){return J.test(e.nodeName)},input:function(e){return Q.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||"text"===t.toLowerCase())},first:ve(function(){return[0]}),last:ve(function(e,t){return[t-1]}),eq:ve(function(e,t,n){return[n<0?n+t:n]}),even:ve(function(e,t){for(var n=0;n<t;n+=2)e.push(n);return e}),odd:ve(function(e,t){for(var n=1;n<t;n+=2)e.push(n);return e}),lt:ve(function(e,t,n){for(var r=n<0?n+t:t<n?t:n;0<=--r;)e.push(r);return e}),gt:ve(function(e,t,n){for(var r=n<0?n+t:n;++r<t;)e.push(r);return e})}}).pseudos.nth=b.pseudos.eq,{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})b.pseudos[e]=de(e);for(e in{submit:!0,reset:!0})b.pseudos[e]=he(e);function me(){}function xe(e){for(var t=0,n=e.length,r="";t<n;t++)r+=e[t].value;return r}function be(s,e,t){var u=e.dir,l=e.next,c=l||u,f=t&&"parentNode"===c,p=r++;return e.first?function(e,t,n){while(e=e[u])if(1===e.nodeType||f)return s(e,t,n);return!1}:function(e,t,n){var r,i,o,a=[k,p];if(n){while(e=e[u])if((1===e.nodeType||f)&&s(e,t,n))return!0}else while(e=e[u])if(1===e.nodeType||f)if(i=(o=e[S]||(e[S]={}))[e.uniqueID]||(o[e.uniqueID]={}),l&&l===e.nodeName.toLowerCase())e=e[u]||e;else{if((r=i[c])&&r[0]===k&&r[1]===p)return a[2]=r[2];if((i[c]=a)[2]=s(e,t,n))return!0}return!1}}function we(i){return 1<i.length?function(e,t,n){var r=i.length;while(r--)if(!i[r](e,t,n))return!1;return!0}:i[0]}function Te(e,t,n,r,i){for(var o,a=[],s=0,u=e.length,l=null!=t;s<u;s++)(o=e[s])&&(n&&!n(o,r,i)||(a.push(o),l&&t.push(s)));return a}function Ce(d,h,g,v,y,e){return v&&!v[S]&&(v=Ce(v)),y&&!y[S]&&(y=Ce(y,e)),le(function(e,t,n,r){var i,o,a,s=[],u=[],l=t.length,c=e||function(e,t,n){for(var r=0,i=t.length;r<i;r++)se(e,t[r],n);return n}(h||"*",n.nodeType?[n]:n,[]),f=!d||!e&&h?c:Te(c,s,d,n,r),p=g?y||(e?d:l||v)?[]:t:f;if(g&&g(f,p,n,r),v){i=Te(p,u),v(i,[],n,r),o=i.length;while(o--)(a=i[o])&&(p[u[o]]=!(f[u[o]]=a))}if(e){if(y||d){if(y){i=[],o=p.length;while(o--)(a=p[o])&&i.push(f[o]=a);y(null,p=[],i,r)}o=p.length;while(o--)(a=p[o])&&-1<(i=y?P(e,a):s[o])&&(e[i]=!(t[i]=a))}}else p=Te(p===t?p.splice(l,p.length):p),y?y(null,t,p,r):H.apply(t,p)})}function Ee(e){for(var i,t,n,r=e.length,o=b.relative[e[0].type],a=o||b.relative[" "],s=o?1:0,u=be(function(e){return e===i},a,!0),l=be(function(e){return-1<P(i,e)},a,!0),c=[function(e,t,n){var r=!o&&(n||t!==w)||((i=t).nodeType?u(e,t,n):l(e,t,n));return i=null,r}];s<r;s++)if(t=b.relative[e[s].type])c=[be(we(c),t)];else{if((t=b.filter[e[s].type].apply(null,e[s].matches))[S]){for(n=++s;n<r;n++)if(b.relative[e[n].type])break;return Ce(1<s&&we(c),1<s&&xe(e.slice(0,s-1).concat({value:" "===e[s-2].type?"*":""})).replace($,"$1"),t,s<n&&Ee(e.slice(s,n)),n<r&&Ee(e=e.slice(n)),n<r&&xe(e))}c.push(t)}return we(c)}return me.prototype=b.filters=b.pseudos,b.setFilters=new me,h=se.tokenize=function(e,t){var n,r,i,o,a,s,u,l=x[e+" "];if(l)return t?0:l.slice(0);a=e,s=[],u=b.preFilter;while(a){for(o in n&&!(r=_.exec(a))||(r&&(a=a.slice(r[0].length)||a),s.push(i=[])),n=!1,(r=z.exec(a))&&(n=r.shift(),i.push({value:n,type:r[0].replace($," ")}),a=a.slice(n.length)),b.filter)!(r=G[o].exec(a))||u[o]&&!(r=u[o](r))||(n=r.shift(),i.push({value:n,type:o,matches:r}),a=a.slice(n.length));if(!n)break}return t?a.length:a?se.error(e):x(e,s).slice(0)},f=se.compile=function(e,t){var n,v,y,m,x,r,i=[],o=[],a=A[e+" "];if(!a){t||(t=h(e)),n=t.length;while(n--)(a=Ee(t[n]))[S]?i.push(a):o.push(a);(a=A(e,(v=o,m=0<(y=i).length,x=0<v.length,r=function(e,t,n,r,i){var o,a,s,u=0,l="0",c=e&&[],f=[],p=w,d=e||x&&b.find.TAG("*",i),h=k+=null==p?1:Math.random()||.1,g=d.length;for(i&&(w=t==C||t||i);l!==g&&null!=(o=d[l]);l++){if(x&&o){a=0,t||o.ownerDocument==C||(T(o),n=!E);while(s=v[a++])if(s(o,t||C,n)){r.push(o);break}i&&(k=h)}m&&((o=!s&&o)&&u--,e&&c.push(o))}if(u+=l,m&&l!==u){a=0;while(s=y[a++])s(c,f,t,n);if(e){if(0<u)while(l--)c[l]||f[l]||(f[l]=q.call(r));f=Te(f)}H.apply(r,f),i&&!e&&0<f.length&&1<u+y.length&&se.uniqueSort(r)}return i&&(k=h,w=p),c},m?le(r):r))).selector=e}return a},g=se.select=function(e,t,n,r){var i,o,a,s,u,l="function"==typeof e&&e,c=!r&&h(e=l.selector||e);if(n=n||[],1===c.length){if(2<(o=c[0]=c[0].slice(0)).length&&"ID"===(a=o[0]).type&&9===t.nodeType&&E&&b.relative[o[1].type]){if(!(t=(b.find.ID(a.matches[0].replace(te,ne),t)||[])[0]))return n;l&&(t=t.parentNode),e=e.slice(o.shift().value.length)}i=G.needsContext.test(e)?0:o.length;while(i--){if(a=o[i],b.relative[s=a.type])break;if((u=b.find[s])&&(r=u(a.matches[0].replace(te,ne),ee.test(o[0].type)&&ye(t.parentNode)||t))){if(o.splice(i,1),!(e=r.length&&xe(o)))return H.apply(n,r),n;break}}}return(l||f(e,c))(r,t,!E,n,!t||ee.test(e)&&ye(t.parentNode)||t),n},d.sortStable=S.split("").sort(D).join("")===S,d.detectDuplicates=!!l,T(),d.sortDetached=ce(function(e){return 1&e.compareDocumentPosition(C.createElement("fieldset"))}),ce(function(e){return e.innerHTML="<a href='#'></a>","#"===e.firstChild.getAttribute("href")})||fe("type|href|height|width",function(e,t,n){if(!n)return e.getAttribute(t,"type"===t.toLowerCase()?1:2)}),d.attributes&&ce(function(e){return e.innerHTML="<input/>",e.firstChild.setAttribute("value",""),""===e.firstChild.getAttribute("value")})||fe("value",function(e,t,n){if(!n&&"input"===e.nodeName.toLowerCase())return e.defaultValue}),ce(function(e){return null==e.getAttribute("disabled")})||fe(R,function(e,t,n){var r;if(!n)return!0===e[t]?t.toLowerCase():(r=e.getAttributeNode(t))&&r.specified?r.value:null}),se}(C);S.find=d,S.expr=d.selectors,S.expr[":"]=S.expr.pseudos,S.uniqueSort=S.unique=d.uniqueSort,S.text=d.getText,S.isXMLDoc=d.isXML,S.contains=d.contains,S.escapeSelector=d.escape;var h=function(e,t,n){var r=[],i=void 0!==n;while((e=e[t])&&9!==e.nodeType)if(1===e.nodeType){if(i&&S(e).is(n))break;r.push(e)}return r},T=function(e,t){for(var n=[];e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n},k=S.expr.match.needsContext;function A(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()}var N=/^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;function D(e,n,r){return m(n)?S.grep(e,function(e,t){return!!n.call(e,t,e)!==r}):n.nodeType?S.grep(e,function(e){return e===n!==r}):"string"!=typeof n?S.grep(e,function(e){return-1<i.call(n,e)!==r}):S.filter(n,e,r)}S.filter=function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?S.find.matchesSelector(r,e)?[r]:[]:S.find.matches(e,S.grep(t,function(e){return 1===e.nodeType}))},S.fn.extend({find:function(e){var t,n,r=this.length,i=this;if("string"!=typeof e)return this.pushStack(S(e).filter(function(){for(t=0;t<r;t++)if(S.contains(i[t],this))return!0}));for(n=this.pushStack([]),t=0;t<r;t++)S.find(e,i[t],n);return 1<r?S.uniqueSort(n):n},filter:function(e){return this.pushStack(D(this,e||[],!1))},not:function(e){return this.pushStack(D(this,e||[],!0))},is:function(e){return!!D(this,"string"==typeof e&&k.test(e)?S(e):e||[],!1).length}});var j,q=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;(S.fn.init=function(e,t,n){var r,i;if(!e)return this;if(n=n||j,"string"==typeof e){if(!(r="<"===e[0]&&">"===e[e.length-1]&&3<=e.length?[null,e,null]:q.exec(e))||!r[1]&&t)return!t||t.jquery?(t||n).find(e):this.constructor(t).find(e);if(r[1]){if(t=t instanceof S?t[0]:t,S.merge(this,S.parseHTML(r[1],t&&t.nodeType?t.ownerDocument||t:E,!0)),N.test(r[1])&&S.isPlainObject(t))for(r in t)m(this[r])?this[r](t[r]):this.attr(r,t[r]);return this}return(i=E.getElementById(r[2]))&&(this[0]=i,this.length=1),this}return e.nodeType?(this[0]=e,this.length=1,this):m(e)?void 0!==n.ready?n.ready(e):e(S):S.makeArray(e,this)}).prototype=S.fn,j=S(E);var L=/^(?:parents|prev(?:Until|All))/,H={children:!0,contents:!0,next:!0,prev:!0};function O(e,t){while((e=e[t])&&1!==e.nodeType);return e}S.fn.extend({has:function(e){var t=S(e,this),n=t.length;return this.filter(function(){for(var e=0;e<n;e++)if(S.contains(this,t[e]))return!0})},closest:function(e,t){var n,r=0,i=this.length,o=[],a="string"!=typeof e&&S(e);if(!k.test(e))for(;r<i;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(n.nodeType<11&&(a?-1<a.index(n):1===n.nodeType&&S.find.matchesSelector(n,e))){o.push(n);break}return this.pushStack(1<o.length?S.uniqueSort(o):o)},index:function(e){return e?"string"==typeof e?i.call(S(e),this[0]):i.call(this,e.jquery?e[0]:e):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){return this.pushStack(S.uniqueSort(S.merge(this.get(),S(e,t))))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}}),S.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return h(e,"parentNode")},parentsUntil:function(e,t,n){return h(e,"parentNode",n)},next:function(e){return O(e,"nextSibling")},prev:function(e){return O(e,"previousSibling")},nextAll:function(e){return h(e,"nextSibling")},prevAll:function(e){return h(e,"previousSibling")},nextUntil:function(e,t,n){return h(e,"nextSibling",n)},prevUntil:function(e,t,n){return h(e,"previousSibling",n)},siblings:function(e){return T((e.parentNode||{}).firstChild,e)},children:function(e){return T(e.firstChild)},contents:function(e){return null!=e.contentDocument&&r(e.contentDocument)?e.contentDocument:(A(e,"template")&&(e=e.content||e),S.merge([],e.childNodes))}},function(r,i){S.fn[r]=function(e,t){var n=S.map(this,i,e);return"Until"!==r.slice(-5)&&(t=e),t&&"string"==typeof t&&(n=S.filter(t,n)),1<this.length&&(H[r]||S.uniqueSort(n),L.test(r)&&n.reverse()),this.pushStack(n)}});var P=/[^\x20\t\r\n\f]+/g;function R(e){return e}function M(e){throw e}function I(e,t,n,r){var i;try{e&&m(i=e.promise)?i.call(e).done(t).fail(n):e&&m(i=e.then)?i.call(e,t,n):t.apply(void 0,[e].slice(r))}catch(e){n.apply(void 0,[e])}}S.Callbacks=function(r){var e,n;r="string"==typeof r?(e=r,n={},S.each(e.match(P)||[],function(e,t){n[t]=!0}),n):S.extend({},r);var i,t,o,a,s=[],u=[],l=-1,c=function(){for(a=a||r.once,o=i=!0;u.length;l=-1){t=u.shift();while(++l<s.length)!1===s[l].apply(t[0],t[1])&&r.stopOnFalse&&(l=s.length,t=!1)}r.memory||(t=!1),i=!1,a&&(s=t?[]:"")},f={add:function(){return s&&(t&&!i&&(l=s.length-1,u.push(t)),function n(e){S.each(e,function(e,t){m(t)?r.unique&&f.has(t)||s.push(t):t&&t.length&&"string"!==w(t)&&n(t)})}(arguments),t&&!i&&c()),this},remove:function(){return S.each(arguments,function(e,t){var n;while(-1<(n=S.inArray(t,s,n)))s.splice(n,1),n<=l&&l--}),this},has:function(e){return e?-1<S.inArray(e,s):0<s.length},empty:function(){return s&&(s=[]),this},disable:function(){return a=u=[],s=t="",this},disabled:function(){return!s},lock:function(){return a=u=[],t||i||(s=t=""),this},locked:function(){return!!a},fireWith:function(e,t){return a||(t=[e,(t=t||[]).slice?t.slice():t],u.push(t),i||c()),this},fire:function(){return f.fireWith(this,arguments),this},fired:function(){return!!o}};return f},S.extend({Deferred:function(e){var o=[["notify","progress",S.Callbacks("memory"),S.Callbacks("memory"),2],["resolve","done",S.Callbacks("once memory"),S.Callbacks("once memory"),0,"resolved"],["reject","fail",S.Callbacks("once memory"),S.Callbacks("once memory"),1,"rejected"]],i="pending",a={state:function(){return i},always:function(){return s.done(arguments).fail(arguments),this},"catch":function(e){return a.then(null,e)},pipe:function(){var i=arguments;return S.Deferred(function(r){S.each(o,function(e,t){var n=m(i[t[4]])&&i[t[4]];s[t[1]](function(){var e=n&&n.apply(this,arguments);e&&m(e.promise)?e.promise().progress(r.notify).done(r.resolve).fail(r.reject):r[t[0]+"With"](this,n?[e]:arguments)})}),i=null}).promise()},then:function(t,n,r){var u=0;function l(i,o,a,s){return function(){var n=this,r=arguments,e=function(){var e,t;if(!(i<u)){if((e=a.apply(n,r))===o.promise())throw new TypeError("Thenable self-resolution");t=e&&("object"==typeof e||"function"==typeof e)&&e.then,m(t)?s?t.call(e,l(u,o,R,s),l(u,o,M,s)):(u++,t.call(e,l(u,o,R,s),l(u,o,M,s),l(u,o,R,o.notifyWith))):(a!==R&&(n=void 0,r=[e]),(s||o.resolveWith)(n,r))}},t=s?e:function(){try{e()}catch(e){S.Deferred.exceptionHook&&S.Deferred.exceptionHook(e,t.stackTrace),u<=i+1&&(a!==M&&(n=void 0,r=[e]),o.rejectWith(n,r))}};i?t():(S.Deferred.getStackHook&&(t.stackTrace=S.Deferred.getStackHook()),C.setTimeout(t))}}return S.Deferred(function(e){o[0][3].add(l(0,e,m(r)?r:R,e.notifyWith)),o[1][3].add(l(0,e,m(t)?t:R)),o[2][3].add(l(0,e,m(n)?n:M))}).promise()},promise:function(e){return null!=e?S.extend(e,a):a}},s={};return S.each(o,function(e,t){var n=t[2],r=t[5];a[t[1]]=n.add,r&&n.add(function(){i=r},o[3-e][2].disable,o[3-e][3].disable,o[0][2].lock,o[0][3].lock),n.add(t[3].fire),s[t[0]]=function(){return s[t[0]+"With"](this===s?void 0:this,arguments),this},s[t[0]+"With"]=n.fireWith}),a.promise(s),e&&e.call(s,s),s},when:function(e){var n=arguments.length,t=n,r=Array(t),i=s.call(arguments),o=S.Deferred(),a=function(t){return function(e){r[t]=this,i[t]=1<arguments.length?s.call(arguments):e,--n||o.resolveWith(r,i)}};if(n<=1&&(I(e,o.done(a(t)).resolve,o.reject,!n),"pending"===o.state()||m(i[t]&&i[t].then)))return o.then();while(t--)I(i[t],a(t),o.reject);return o.promise()}});var W=/^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;S.Deferred.exceptionHook=function(e,t){C.console&&C.console.warn&&e&&W.test(e.name)&&C.console.warn("jQuery.Deferred exception: "+e.message,e.stack,t)},S.readyException=function(e){C.setTimeout(function(){throw e})};var F=S.Deferred();function B(){E.removeEventListener("DOMContentLoaded",B),C.removeEventListener("load",B),S.ready()}S.fn.ready=function(e){return F.then(e)["catch"](function(e){S.readyException(e)}),this},S.extend({isReady:!1,readyWait:1,ready:function(e){(!0===e?--S.readyWait:S.isReady)||(S.isReady=!0)!==e&&0<--S.readyWait||F.resolveWith(E,[S])}}),S.ready.then=F.then,"complete"===E.readyState||"loading"!==E.readyState&&!E.documentElement.doScroll?C.setTimeout(S.ready):(E.addEventListener("DOMContentLoaded",B),C.addEventListener("load",B));var $=function(e,t,n,r,i,o,a){var s=0,u=e.length,l=null==n;if("object"===w(n))for(s in i=!0,n)$(e,t,s,n[s],!0,o,a);else if(void 0!==r&&(i=!0,m(r)||(a=!0),l&&(a?(t.call(e,r),t=null):(l=t,t=function(e,t,n){return l.call(S(e),n)})),t))for(;s<u;s++)t(e[s],n,a?r:r.call(e[s],s,t(e[s],n)));return i?e:l?t.call(e):u?t(e[0],n):o},_=/^-ms-/,z=/-([a-z])/g;function U(e,t){return t.toUpperCase()}function X(e){return e.replace(_,"ms-").replace(z,U)}var V=function(e){return 1===e.nodeType||9===e.nodeType||!+e.nodeType};function G(){this.expando=S.expando+G.uid++}G.uid=1,G.prototype={cache:function(e){var t=e[this.expando];return t||(t={},V(e)&&(e.nodeType?e[this.expando]=t:Object.defineProperty(e,this.expando,{value:t,configurable:!0}))),t},set:function(e,t,n){var r,i=this.cache(e);if("string"==typeof t)i[X(t)]=n;else for(r in t)i[X(r)]=t[r];return i},get:function(e,t){return void 0===t?this.cache(e):e[this.expando]&&e[this.expando][X(t)]},access:function(e,t,n){return void 0===t||t&&"string"==typeof t&&void 0===n?this.get(e,t):(this.set(e,t,n),void 0!==n?n:t)},remove:function(e,t){var n,r=e[this.expando];if(void 0!==r){if(void 0!==t){n=(t=Array.isArray(t)?t.map(X):(t=X(t))in r?[t]:t.match(P)||[]).length;while(n--)delete r[t[n]]}(void 0===t||S.isEmptyObject(r))&&(e.nodeType?e[this.expando]=void 0:delete e[this.expando])}},hasData:function(e){var t=e[this.expando];return void 0!==t&&!S.isEmptyObject(t)}};var Y=new G,Q=new G,J=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,K=/[A-Z]/g;function Z(e,t,n){var r,i;if(void 0===n&&1===e.nodeType)if(r="data-"+t.replace(K,"-$&").toLowerCase(),"string"==typeof(n=e.getAttribute(r))){try{n="true"===(i=n)||"false"!==i&&("null"===i?null:i===+i+""?+i:J.test(i)?JSON.parse(i):i)}catch(e){}Q.set(e,t,n)}else n=void 0;return n}S.extend({hasData:function(e){return Q.hasData(e)||Y.hasData(e)},data:function(e,t,n){return Q.access(e,t,n)},removeData:function(e,t){Q.remove(e,t)},_data:function(e,t,n){return Y.access(e,t,n)},_removeData:function(e,t){Y.remove(e,t)}}),S.fn.extend({data:function(n,e){var t,r,i,o=this[0],a=o&&o.attributes;if(void 0===n){if(this.length&&(i=Q.get(o),1===o.nodeType&&!Y.get(o,"hasDataAttrs"))){t=a.length;while(t--)a[t]&&0===(r=a[t].name).indexOf("data-")&&(r=X(r.slice(5)),Z(o,r,i[r]));Y.set(o,"hasDataAttrs",!0)}return i}return"object"==typeof n?this.each(function(){Q.set(this,n)}):$(this,function(e){var t;if(o&&void 0===e)return void 0!==(t=Q.get(o,n))?t:void 0!==(t=Z(o,n))?t:void 0;this.each(function(){Q.set(this,n,e)})},null,e,1<arguments.length,null,!0)},removeData:function(e){return this.each(function(){Q.remove(this,e)})}}),S.extend({queue:function(e,t,n){var r;if(e)return t=(t||"fx")+"queue",r=Y.get(e,t),n&&(!r||Array.isArray(n)?r=Y.access(e,t,S.makeArray(n)):r.push(n)),r||[]},dequeue:function(e,t){t=t||"fx";var n=S.queue(e,t),r=n.length,i=n.shift(),o=S._queueHooks(e,t);"inprogress"===i&&(i=n.shift(),r--),i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,function(){S.dequeue(e,t)},o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return Y.get(e,n)||Y.access(e,n,{empty:S.Callbacks("once memory").add(function(){Y.remove(e,[t+"queue",n])})})}}),S.fn.extend({queue:function(t,n){var e=2;return"string"!=typeof t&&(n=t,t="fx",e--),arguments.length<e?S.queue(this[0],t):void 0===n?this:this.each(function(){var e=S.queue(this,t,n);S._queueHooks(this,t),"fx"===t&&"inprogress"!==e[0]&&S.dequeue(this,t)})},dequeue:function(e){return this.each(function(){S.dequeue(this,e)})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,t){var n,r=1,i=S.Deferred(),o=this,a=this.length,s=function(){--r||i.resolveWith(o,[o])};"string"!=typeof e&&(t=e,e=void 0),e=e||"fx";while(a--)(n=Y.get(o[a],e+"queueHooks"))&&n.empty&&(r++,n.empty.add(s));return s(),i.promise(t)}});var ee=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,te=new RegExp("^(?:([+-])=|)("+ee+")([a-z%]*)$","i"),ne=["Top","Right","Bottom","Left"],re=E.documentElement,ie=function(e){return S.contains(e.ownerDocument,e)},oe={composed:!0};re.getRootNode&&(ie=function(e){return S.contains(e.ownerDocument,e)||e.getRootNode(oe)===e.ownerDocument});var ae=function(e,t){return"none"===(e=t||e).style.display||""===e.style.display&&ie(e)&&"none"===S.css(e,"display")};function se(e,t,n,r){var i,o,a=20,s=r?function(){return r.cur()}:function(){return S.css(e,t,"")},u=s(),l=n&&n[3]||(S.cssNumber[t]?"":"px"),c=e.nodeType&&(S.cssNumber[t]||"px"!==l&&+u)&&te.exec(S.css(e,t));if(c&&c[3]!==l){u/=2,l=l||c[3],c=+u||1;while(a--)S.style(e,t,c+l),(1-o)*(1-(o=s()/u||.5))<=0&&(a=0),c/=o;c*=2,S.style(e,t,c+l),n=n||[]}return n&&(c=+c||+u||0,i=n[1]?c+(n[1]+1)*n[2]:+n[2],r&&(r.unit=l,r.start=c,r.end=i)),i}var ue={};function le(e,t){for(var n,r,i,o,a,s,u,l=[],c=0,f=e.length;c<f;c++)(r=e[c]).style&&(n=r.style.display,t?("none"===n&&(l[c]=Y.get(r,"display")||null,l[c]||(r.style.display="")),""===r.style.display&&ae(r)&&(l[c]=(u=a=o=void 0,a=(i=r).ownerDocument,s=i.nodeName,(u=ue[s])||(o=a.body.appendChild(a.createElement(s)),u=S.css(o,"display"),o.parentNode.removeChild(o),"none"===u&&(u="block"),ue[s]=u)))):"none"!==n&&(l[c]="none",Y.set(r,"display",n)));for(c=0;c<f;c++)null!=l[c]&&(e[c].style.display=l[c]);return e}S.fn.extend({show:function(){return le(this,!0)},hide:function(){return le(this)},toggle:function(e){return"boolean"==typeof e?e?this.show():this.hide():this.each(function(){ae(this)?S(this).show():S(this).hide()})}});var ce,fe,pe=/^(?:checkbox|radio)$/i,de=/<([a-z][^\/\0>\x20\t\r\n\f]*)/i,he=/^$|^module$|\/(?:java|ecma)script/i;ce=E.createDocumentFragment().appendChild(E.createElement("div")),(fe=E.createElement("input")).setAttribute("type","radio"),fe.setAttribute("checked","checked"),fe.setAttribute("name","t"),ce.appendChild(fe),y.checkClone=ce.cloneNode(!0).cloneNode(!0).lastChild.checked,ce.innerHTML="<textarea>x</textarea>",y.noCloneChecked=!!ce.cloneNode(!0).lastChild.defaultValue,ce.innerHTML="<option></option>",y.option=!!ce.lastChild;var ge={thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};function ve(e,t){var n;return n="undefined"!=typeof e.getElementsByTagName?e.getElementsByTagName(t||"*"):"undefined"!=typeof e.querySelectorAll?e.querySelectorAll(t||"*"):[],void 0===t||t&&A(e,t)?S.merge([e],n):n}function ye(e,t){for(var n=0,r=e.length;n<r;n++)Y.set(e[n],"globalEval",!t||Y.get(t[n],"globalEval"))}ge.tbody=ge.tfoot=ge.colgroup=ge.caption=ge.thead,ge.th=ge.td,y.option||(ge.optgroup=ge.option=[1,"<select multiple='multiple'>","</select>"]);var me=/<|&#?\w+;/;function xe(e,t,n,r,i){for(var o,a,s,u,l,c,f=t.createDocumentFragment(),p=[],d=0,h=e.length;d<h;d++)if((o=e[d])||0===o)if("object"===w(o))S.merge(p,o.nodeType?[o]:o);else if(me.test(o)){a=a||f.appendChild(t.createElement("div")),s=(de.exec(o)||["",""])[1].toLowerCase(),u=ge[s]||ge._default,a.innerHTML=u[1]+S.htmlPrefilter(o)+u[2],c=u[0];while(c--)a=a.lastChild;S.merge(p,a.childNodes),(a=f.firstChild).textContent=""}else p.push(t.createTextNode(o));f.textContent="",d=0;while(o=p[d++])if(r&&-1<S.inArray(o,r))i&&i.push(o);else if(l=ie(o),a=ve(f.appendChild(o),"script"),l&&ye(a),n){c=0;while(o=a[c++])he.test(o.type||"")&&n.push(o)}return f}var be=/^key/,we=/^(?:mouse|pointer|contextmenu|drag|drop)|click/,Te=/^([^.]*)(?:\.(.+)|)/;function Ce(){return!0}function Ee(){return!1}function Se(e,t){return e===function(){try{return E.activeElement}catch(e){}}()==("focus"===t)}function ke(e,t,n,r,i,o){var a,s;if("object"==typeof t){for(s in"string"!=typeof n&&(r=r||n,n=void 0),t)ke(e,s,n,r,t[s],o);return e}if(null==r&&null==i?(i=n,r=n=void 0):null==i&&("string"==typeof n?(i=r,r=void 0):(i=r,r=n,n=void 0)),!1===i)i=Ee;else if(!i)return e;return 1===o&&(a=i,(i=function(e){return S().off(e),a.apply(this,arguments)}).guid=a.guid||(a.guid=S.guid++)),e.each(function(){S.event.add(this,t,i,r,n)})}function Ae(e,i,o){o?(Y.set(e,i,!1),S.event.add(e,i,{namespace:!1,handler:function(e){var t,n,r=Y.get(this,i);if(1&e.isTrigger&&this[i]){if(r.length)(S.event.special[i]||{}).delegateType&&e.stopPropagation();else if(r=s.call(arguments),Y.set(this,i,r),t=o(this,i),this[i](),r!==(n=Y.get(this,i))||t?Y.set(this,i,!1):n={},r!==n)return e.stopImmediatePropagation(),e.preventDefault(),n.value}else r.length&&(Y.set(this,i,{value:S.event.trigger(S.extend(r[0],S.Event.prototype),r.slice(1),this)}),e.stopImmediatePropagation())}})):void 0===Y.get(e,i)&&S.event.add(e,i,Ce)}S.event={global:{},add:function(t,e,n,r,i){var o,a,s,u,l,c,f,p,d,h,g,v=Y.get(t);if(V(t)){n.handler&&(n=(o=n).handler,i=o.selector),i&&S.find.matchesSelector(re,i),n.guid||(n.guid=S.guid++),(u=v.events)||(u=v.events=Object.create(null)),(a=v.handle)||(a=v.handle=function(e){return"undefined"!=typeof S&&S.event.triggered!==e.type?S.event.dispatch.apply(t,arguments):void 0}),l=(e=(e||"").match(P)||[""]).length;while(l--)d=g=(s=Te.exec(e[l])||[])[1],h=(s[2]||"").split(".").sort(),d&&(f=S.event.special[d]||{},d=(i?f.delegateType:f.bindType)||d,f=S.event.special[d]||{},c=S.extend({type:d,origType:g,data:r,handler:n,guid:n.guid,selector:i,needsContext:i&&S.expr.match.needsContext.test(i),namespace:h.join(".")},o),(p=u[d])||((p=u[d]=[]).delegateCount=0,f.setup&&!1!==f.setup.call(t,r,h,a)||t.addEventListener&&t.addEventListener(d,a)),f.add&&(f.add.call(t,c),c.handler.guid||(c.handler.guid=n.guid)),i?p.splice(p.delegateCount++,0,c):p.push(c),S.event.global[d]=!0)}},remove:function(e,t,n,r,i){var o,a,s,u,l,c,f,p,d,h,g,v=Y.hasData(e)&&Y.get(e);if(v&&(u=v.events)){l=(t=(t||"").match(P)||[""]).length;while(l--)if(d=g=(s=Te.exec(t[l])||[])[1],h=(s[2]||"").split(".").sort(),d){f=S.event.special[d]||{},p=u[d=(r?f.delegateType:f.bindType)||d]||[],s=s[2]&&new RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),a=o=p.length;while(o--)c=p[o],!i&&g!==c.origType||n&&n.guid!==c.guid||s&&!s.test(c.namespace)||r&&r!==c.selector&&("**"!==r||!c.selector)||(p.splice(o,1),c.selector&&p.delegateCount--,f.remove&&f.remove.call(e,c));a&&!p.length&&(f.teardown&&!1!==f.teardown.call(e,h,v.handle)||S.removeEvent(e,d,v.handle),delete u[d])}else for(d in u)S.event.remove(e,d+t[l],n,r,!0);S.isEmptyObject(u)&&Y.remove(e,"handle events")}},dispatch:function(e){var t,n,r,i,o,a,s=new Array(arguments.length),u=S.event.fix(e),l=(Y.get(this,"events")||Object.create(null))[u.type]||[],c=S.event.special[u.type]||{};for(s[0]=u,t=1;t<arguments.length;t++)s[t]=arguments[t];if(u.delegateTarget=this,!c.preDispatch||!1!==c.preDispatch.call(this,u)){a=S.event.handlers.call(this,u,l),t=0;while((i=a[t++])&&!u.isPropagationStopped()){u.currentTarget=i.elem,n=0;while((o=i.handlers[n++])&&!u.isImmediatePropagationStopped())u.rnamespace&&!1!==o.namespace&&!u.rnamespace.test(o.namespace)||(u.handleObj=o,u.data=o.data,void 0!==(r=((S.event.special[o.origType]||{}).handle||o.handler).apply(i.elem,s))&&!1===(u.result=r)&&(u.preventDefault(),u.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,u),u.result}},handlers:function(e,t){var n,r,i,o,a,s=[],u=t.delegateCount,l=e.target;if(u&&l.nodeType&&!("click"===e.type&&1<=e.button))for(;l!==this;l=l.parentNode||this)if(1===l.nodeType&&("click"!==e.type||!0!==l.disabled)){for(o=[],a={},n=0;n<u;n++)void 0===a[i=(r=t[n]).selector+" "]&&(a[i]=r.needsContext?-1<S(i,this).index(l):S.find(i,this,null,[l]).length),a[i]&&o.push(r);o.length&&s.push({elem:l,handlers:o})}return l=this,u<t.length&&s.push({elem:l,handlers:t.slice(u)}),s},addProp:function(t,e){Object.defineProperty(S.Event.prototype,t,{enumerable:!0,configurable:!0,get:m(e)?function(){if(this.originalEvent)return e(this.originalEvent)}:function(){if(this.originalEvent)return this.originalEvent[t]},set:function(e){Object.defineProperty(this,t,{enumerable:!0,configurable:!0,writable:!0,value:e})}})},fix:function(e){return e[S.expando]?e:new S.Event(e)},special:{load:{noBubble:!0},click:{setup:function(e){var t=this||e;return pe.test(t.type)&&t.click&&A(t,"input")&&Ae(t,"click",Ce),!1},trigger:function(e){var t=this||e;return pe.test(t.type)&&t.click&&A(t,"input")&&Ae(t,"click"),!0},_default:function(e){var t=e.target;return pe.test(t.type)&&t.click&&A(t,"input")&&Y.get(t,"click")||A(t,"a")}},beforeunload:{postDispatch:function(e){void 0!==e.result&&e.originalEvent&&(e.originalEvent.returnValue=e.result)}}}},S.removeEvent=function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n)},S.Event=function(e,t){if(!(this instanceof S.Event))return new S.Event(e,t);e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||void 0===e.defaultPrevented&&!1===e.returnValue?Ce:Ee,this.target=e.target&&3===e.target.nodeType?e.target.parentNode:e.target,this.currentTarget=e.currentTarget,this.relatedTarget=e.relatedTarget):this.type=e,t&&S.extend(this,t),this.timeStamp=e&&e.timeStamp||Date.now(),this[S.expando]=!0},S.Event.prototype={constructor:S.Event,isDefaultPrevented:Ee,isPropagationStopped:Ee,isImmediatePropagationStopped:Ee,isSimulated:!1,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=Ce,e&&!this.isSimulated&&e.preventDefault()},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=Ce,e&&!this.isSimulated&&e.stopPropagation()},stopImmediatePropagation:function(){var e=this.originalEvent;this.isImmediatePropagationStopped=Ce,e&&!this.isSimulated&&e.stopImmediatePropagation(),this.stopPropagation()}},S.each({altKey:!0,bubbles:!0,cancelable:!0,changedTouches:!0,ctrlKey:!0,detail:!0,eventPhase:!0,metaKey:!0,pageX:!0,pageY:!0,shiftKey:!0,view:!0,"char":!0,code:!0,charCode:!0,key:!0,keyCode:!0,button:!0,buttons:!0,clientX:!0,clientY:!0,offsetX:!0,offsetY:!0,pointerId:!0,pointerType:!0,screenX:!0,screenY:!0,targetTouches:!0,toElement:!0,touches:!0,which:function(e){var t=e.button;return null==e.which&&be.test(e.type)?null!=e.charCode?e.charCode:e.keyCode:!e.which&&void 0!==t&&we.test(e.type)?1&t?1:2&t?3:4&t?2:0:e.which}},S.event.addProp),S.each({focus:"focusin",blur:"focusout"},function(e,t){S.event.special[e]={setup:function(){return Ae(this,e,Se),!1},trigger:function(){return Ae(this,e),!0},delegateType:t}}),S.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(e,i){S.event.special[e]={delegateType:i,bindType:i,handle:function(e){var t,n=e.relatedTarget,r=e.handleObj;return n&&(n===this||S.contains(this,n))||(e.type=r.origType,t=r.handler.apply(this,arguments),e.type=i),t}}}),S.fn.extend({on:function(e,t,n,r){return ke(this,e,t,n,r)},one:function(e,t,n,r){return ke(this,e,t,n,r,1)},off:function(e,t,n){var r,i;if(e&&e.preventDefault&&e.handleObj)return r=e.handleObj,S(e.delegateTarget).off(r.namespace?r.origType+"."+r.namespace:r.origType,r.selector,r.handler),this;if("object"==typeof e){for(i in e)this.off(i,t,e[i]);return this}return!1!==t&&"function"!=typeof t||(n=t,t=void 0),!1===n&&(n=Ee),this.each(function(){S.event.remove(this,e,n,t)})}});var Ne=/<script|<style|<link/i,De=/checked\s*(?:[^=]|=\s*.checked.)/i,je=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;function qe(e,t){return A(e,"table")&&A(11!==t.nodeType?t:t.firstChild,"tr")&&S(e).children("tbody")[0]||e}function Le(e){return e.type=(null!==e.getAttribute("type"))+"/"+e.type,e}function He(e){return"true/"===(e.type||"").slice(0,5)?e.type=e.type.slice(5):e.removeAttribute("type"),e}function Oe(e,t){var n,r,i,o,a,s;if(1===t.nodeType){if(Y.hasData(e)&&(s=Y.get(e).events))for(i in Y.remove(t,"handle events"),s)for(n=0,r=s[i].length;n<r;n++)S.event.add(t,i,s[i][n]);Q.hasData(e)&&(o=Q.access(e),a=S.extend({},o),Q.set(t,a))}}function Pe(n,r,i,o){r=g(r);var e,t,a,s,u,l,c=0,f=n.length,p=f-1,d=r[0],h=m(d);if(h||1<f&&"string"==typeof d&&!y.checkClone&&De.test(d))return n.each(function(e){var t=n.eq(e);h&&(r[0]=d.call(this,e,t.html())),Pe(t,r,i,o)});if(f&&(t=(e=xe(r,n[0].ownerDocument,!1,n,o)).firstChild,1===e.childNodes.length&&(e=t),t||o)){for(s=(a=S.map(ve(e,"script"),Le)).length;c<f;c++)u=e,c!==p&&(u=S.clone(u,!0,!0),s&&S.merge(a,ve(u,"script"))),i.call(n[c],u,c);if(s)for(l=a[a.length-1].ownerDocument,S.map(a,He),c=0;c<s;c++)u=a[c],he.test(u.type||"")&&!Y.access(u,"globalEval")&&S.contains(l,u)&&(u.src&&"module"!==(u.type||"").toLowerCase()?S._evalUrl&&!u.noModule&&S._evalUrl(u.src,{nonce:u.nonce||u.getAttribute("nonce")},l):b(u.textContent.replace(je,""),u,l))}return n}function Re(e,t,n){for(var r,i=t?S.filter(t,e):e,o=0;null!=(r=i[o]);o++)n||1!==r.nodeType||S.cleanData(ve(r)),r.parentNode&&(n&&ie(r)&&ye(ve(r,"script")),r.parentNode.removeChild(r));return e}S.extend({htmlPrefilter:function(e){return e},clone:function(e,t,n){var r,i,o,a,s,u,l,c=e.cloneNode(!0),f=ie(e);if(!(y.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||S.isXMLDoc(e)))for(a=ve(c),r=0,i=(o=ve(e)).length;r<i;r++)s=o[r],u=a[r],void 0,"input"===(l=u.nodeName.toLowerCase())&&pe.test(s.type)?u.checked=s.checked:"input"!==l&&"textarea"!==l||(u.defaultValue=s.defaultValue);if(t)if(n)for(o=o||ve(e),a=a||ve(c),r=0,i=o.length;r<i;r++)Oe(o[r],a[r]);else Oe(e,c);return 0<(a=ve(c,"script")).length&&ye(a,!f&&ve(e,"script")),c},cleanData:function(e){for(var t,n,r,i=S.event.special,o=0;void 0!==(n=e[o]);o++)if(V(n)){if(t=n[Y.expando]){if(t.events)for(r in t.events)i[r]?S.event.remove(n,r):S.removeEvent(n,r,t.handle);n[Y.expando]=void 0}n[Q.expando]&&(n[Q.expando]=void 0)}}}),S.fn.extend({detach:function(e){return Re(this,e,!0)},remove:function(e){return Re(this,e)},text:function(e){return $(this,function(e){return void 0===e?S.text(this):this.empty().each(function(){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||(this.textContent=e)})},null,e,arguments.length)},append:function(){return Pe(this,arguments,function(e){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||qe(this,e).appendChild(e)})},prepend:function(){return Pe(this,arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=qe(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return Pe(this,arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return Pe(this,arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},empty:function(){for(var e,t=0;null!=(e=this[t]);t++)1===e.nodeType&&(S.cleanData(ve(e,!1)),e.textContent="");return this},clone:function(e,t){return e=null!=e&&e,t=null==t?e:t,this.map(function(){return S.clone(this,e,t)})},html:function(e){return $(this,function(e){var t=this[0]||{},n=0,r=this.length;if(void 0===e&&1===t.nodeType)return t.innerHTML;if("string"==typeof e&&!Ne.test(e)&&!ge[(de.exec(e)||["",""])[1].toLowerCase()]){e=S.htmlPrefilter(e);try{for(;n<r;n++)1===(t=this[n]||{}).nodeType&&(S.cleanData(ve(t,!1)),t.innerHTML=e);t=0}catch(e){}}t&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var n=[];return Pe(this,arguments,function(e){var t=this.parentNode;S.inArray(this,n)<0&&(S.cleanData(ve(this)),t&&t.replaceChild(e,this))},n)}}),S.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,a){S.fn[e]=function(e){for(var t,n=[],r=S(e),i=r.length-1,o=0;o<=i;o++)t=o===i?this:this.clone(!0),S(r[o])[a](t),u.apply(n,t.get());return this.pushStack(n)}});var Me=new RegExp("^("+ee+")(?!px)[a-z%]+$","i"),Ie=function(e){var t=e.ownerDocument.defaultView;return t&&t.opener||(t=C),t.getComputedStyle(e)},We=function(e,t,n){var r,i,o={};for(i in t)o[i]=e.style[i],e.style[i]=t[i];for(i in r=n.call(e),t)e.style[i]=o[i];return r},Fe=new RegExp(ne.join("|"),"i");function Be(e,t,n){var r,i,o,a,s=e.style;return(n=n||Ie(e))&&(""!==(a=n.getPropertyValue(t)||n[t])||ie(e)||(a=S.style(e,t)),!y.pixelBoxStyles()&&Me.test(a)&&Fe.test(t)&&(r=s.width,i=s.minWidth,o=s.maxWidth,s.minWidth=s.maxWidth=s.width=a,a=n.width,s.width=r,s.minWidth=i,s.maxWidth=o)),void 0!==a?a+"":a}function $e(e,t){return{get:function(){if(!e())return(this.get=t).apply(this,arguments);delete this.get}}}!function(){function e(){if(l){u.style.cssText="position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0",l.style.cssText="position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%",re.appendChild(u).appendChild(l);var e=C.getComputedStyle(l);n="1%"!==e.top,s=12===t(e.marginLeft),l.style.right="60%",o=36===t(e.right),r=36===t(e.width),l.style.position="absolute",i=12===t(l.offsetWidth/3),re.removeChild(u),l=null}}function t(e){return Math.round(parseFloat(e))}var n,r,i,o,a,s,u=E.createElement("div"),l=E.createElement("div");l.style&&(l.style.backgroundClip="content-box",l.cloneNode(!0).style.backgroundClip="",y.clearCloneStyle="content-box"===l.style.backgroundClip,S.extend(y,{boxSizingReliable:function(){return e(),r},pixelBoxStyles:function(){return e(),o},pixelPosition:function(){return e(),n},reliableMarginLeft:function(){return e(),s},scrollboxSize:function(){return e(),i},reliableTrDimensions:function(){var e,t,n,r;return null==a&&(e=E.createElement("table"),t=E.createElement("tr"),n=E.createElement("div"),e.style.cssText="position:absolute;left:-11111px",t.style.height="1px",n.style.height="9px",re.appendChild(e).appendChild(t).appendChild(n),r=C.getComputedStyle(t),a=3<parseInt(r.height),re.removeChild(e)),a}}))}();var _e=["Webkit","Moz","ms"],ze=E.createElement("div").style,Ue={};function Xe(e){var t=S.cssProps[e]||Ue[e];return t||(e in ze?e:Ue[e]=function(e){var t=e[0].toUpperCase()+e.slice(1),n=_e.length;while(n--)if((e=_e[n]+t)in ze)return e}(e)||e)}var Ve=/^(none|table(?!-c[ea]).+)/,Ge=/^--/,Ye={position:"absolute",visibility:"hidden",display:"block"},Qe={letterSpacing:"0",fontWeight:"400"};function Je(e,t,n){var r=te.exec(t);return r?Math.max(0,r[2]-(n||0))+(r[3]||"px"):t}function Ke(e,t,n,r,i,o){var a="width"===t?1:0,s=0,u=0;if(n===(r?"border":"content"))return 0;for(;a<4;a+=2)"margin"===n&&(u+=S.css(e,n+ne[a],!0,i)),r?("content"===n&&(u-=S.css(e,"padding"+ne[a],!0,i)),"margin"!==n&&(u-=S.css(e,"border"+ne[a]+"Width",!0,i))):(u+=S.css(e,"padding"+ne[a],!0,i),"padding"!==n?u+=S.css(e,"border"+ne[a]+"Width",!0,i):s+=S.css(e,"border"+ne[a]+"Width",!0,i));return!r&&0<=o&&(u+=Math.max(0,Math.ceil(e["offset"+t[0].toUpperCase()+t.slice(1)]-o-u-s-.5))||0),u}function Ze(e,t,n){var r=Ie(e),i=(!y.boxSizingReliable()||n)&&"border-box"===S.css(e,"boxSizing",!1,r),o=i,a=Be(e,t,r),s="offset"+t[0].toUpperCase()+t.slice(1);if(Me.test(a)){if(!n)return a;a="auto"}return(!y.boxSizingReliable()&&i||!y.reliableTrDimensions()&&A(e,"tr")||"auto"===a||!parseFloat(a)&&"inline"===S.css(e,"display",!1,r))&&e.getClientRects().length&&(i="border-box"===S.css(e,"boxSizing",!1,r),(o=s in e)&&(a=e[s])),(a=parseFloat(a)||0)+Ke(e,t,n||(i?"border":"content"),o,r,a)+"px"}function et(e,t,n,r,i){return new et.prototype.init(e,t,n,r,i)}S.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Be(e,"opacity");return""===n?"1":n}}}},cssNumber:{animationIterationCount:!0,columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,gridArea:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnStart:!0,gridRow:!0,gridRowEnd:!0,gridRowStart:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{},style:function(e,t,n,r){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var i,o,a,s=X(t),u=Ge.test(t),l=e.style;if(u||(t=Xe(s)),a=S.cssHooks[t]||S.cssHooks[s],void 0===n)return a&&"get"in a&&void 0!==(i=a.get(e,!1,r))?i:l[t];"string"===(o=typeof n)&&(i=te.exec(n))&&i[1]&&(n=se(e,t,i),o="number"),null!=n&&n==n&&("number"!==o||u||(n+=i&&i[3]||(S.cssNumber[s]?"":"px")),y.clearCloneStyle||""!==n||0!==t.indexOf("background")||(l[t]="inherit"),a&&"set"in a&&void 0===(n=a.set(e,n,r))||(u?l.setProperty(t,n):l[t]=n))}},css:function(e,t,n,r){var i,o,a,s=X(t);return Ge.test(t)||(t=Xe(s)),(a=S.cssHooks[t]||S.cssHooks[s])&&"get"in a&&(i=a.get(e,!0,n)),void 0===i&&(i=Be(e,t,r)),"normal"===i&&t in Qe&&(i=Qe[t]),""===n||n?(o=parseFloat(i),!0===n||isFinite(o)?o||0:i):i}}),S.each(["height","width"],function(e,u){S.cssHooks[u]={get:function(e,t,n){if(t)return!Ve.test(S.css(e,"display"))||e.getClientRects().length&&e.getBoundingClientRect().width?Ze(e,u,n):We(e,Ye,function(){return Ze(e,u,n)})},set:function(e,t,n){var r,i=Ie(e),o=!y.scrollboxSize()&&"absolute"===i.position,a=(o||n)&&"border-box"===S.css(e,"boxSizing",!1,i),s=n?Ke(e,u,n,a,i):0;return a&&o&&(s-=Math.ceil(e["offset"+u[0].toUpperCase()+u.slice(1)]-parseFloat(i[u])-Ke(e,u,"border",!1,i)-.5)),s&&(r=te.exec(t))&&"px"!==(r[3]||"px")&&(e.style[u]=t,t=S.css(e,u)),Je(0,t,s)}}}),S.cssHooks.marginLeft=$e(y.reliableMarginLeft,function(e,t){if(t)return(parseFloat(Be(e,"marginLeft"))||e.getBoundingClientRect().left-We(e,{marginLeft:0},function(){return e.getBoundingClientRect().left}))+"px"}),S.each({margin:"",padding:"",border:"Width"},function(i,o){S.cssHooks[i+o]={expand:function(e){for(var t=0,n={},r="string"==typeof e?e.split(" "):[e];t<4;t++)n[i+ne[t]+o]=r[t]||r[t-2]||r[0];return n}},"margin"!==i&&(S.cssHooks[i+o].set=Je)}),S.fn.extend({css:function(e,t){return $(this,function(e,t,n){var r,i,o={},a=0;if(Array.isArray(t)){for(r=Ie(e),i=t.length;a<i;a++)o[t[a]]=S.css(e,t[a],!1,r);return o}return void 0!==n?S.style(e,t,n):S.css(e,t)},e,t,1<arguments.length)}}),((S.Tween=et).prototype={constructor:et,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||S.easing._default,this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(S.cssNumber[n]?"":"px")},cur:function(){var e=et.propHooks[this.prop];return e&&e.get?e.get(this):et.propHooks._default.get(this)},run:function(e){var t,n=et.propHooks[this.prop];return this.options.duration?this.pos=t=S.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):this.pos=t=e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):et.propHooks._default.set(this),this}}).init.prototype=et.prototype,(et.propHooks={_default:{get:function(e){var t;return 1!==e.elem.nodeType||null!=e.elem[e.prop]&&null==e.elem.style[e.prop]?e.elem[e.prop]:(t=S.css(e.elem,e.prop,""))&&"auto"!==t?t:0},set:function(e){S.fx.step[e.prop]?S.fx.step[e.prop](e):1!==e.elem.nodeType||!S.cssHooks[e.prop]&&null==e.elem.style[Xe(e.prop)]?e.elem[e.prop]=e.now:S.style(e.elem,e.prop,e.now+e.unit)}}}).scrollTop=et.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},S.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2},_default:"swing"},S.fx=et.prototype.init,S.fx.step={};var tt,nt,rt,it,ot=/^(?:toggle|show|hide)$/,at=/queueHooks$/;function st(){nt&&(!1===E.hidden&&C.requestAnimationFrame?C.requestAnimationFrame(st):C.setTimeout(st,S.fx.interval),S.fx.tick())}function ut(){return C.setTimeout(function(){tt=void 0}),tt=Date.now()}function lt(e,t){var n,r=0,i={height:e};for(t=t?1:0;r<4;r+=2-t)i["margin"+(n=ne[r])]=i["padding"+n]=e;return t&&(i.opacity=i.width=e),i}function ct(e,t,n){for(var r,i=(ft.tweeners[t]||[]).concat(ft.tweeners["*"]),o=0,a=i.length;o<a;o++)if(r=i[o].call(n,t,e))return r}function ft(o,e,t){var n,a,r=0,i=ft.prefilters.length,s=S.Deferred().always(function(){delete u.elem}),u=function(){if(a)return!1;for(var e=tt||ut(),t=Math.max(0,l.startTime+l.duration-e),n=1-(t/l.duration||0),r=0,i=l.tweens.length;r<i;r++)l.tweens[r].run(n);return s.notifyWith(o,[l,n,t]),n<1&&i?t:(i||s.notifyWith(o,[l,1,0]),s.resolveWith(o,[l]),!1)},l=s.promise({elem:o,props:S.extend({},e),opts:S.extend(!0,{specialEasing:{},easing:S.easing._default},t),originalProperties:e,originalOptions:t,startTime:tt||ut(),duration:t.duration,tweens:[],createTween:function(e,t){var n=S.Tween(o,l.opts,e,t,l.opts.specialEasing[e]||l.opts.easing);return l.tweens.push(n),n},stop:function(e){var t=0,n=e?l.tweens.length:0;if(a)return this;for(a=!0;t<n;t++)l.tweens[t].run(1);return e?(s.notifyWith(o,[l,1,0]),s.resolveWith(o,[l,e])):s.rejectWith(o,[l,e]),this}}),c=l.props;for(!function(e,t){var n,r,i,o,a;for(n in e)if(i=t[r=X(n)],o=e[n],Array.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),(a=S.cssHooks[r])&&"expand"in a)for(n in o=a.expand(o),delete e[r],o)n in e||(e[n]=o[n],t[n]=i);else t[r]=i}(c,l.opts.specialEasing);r<i;r++)if(n=ft.prefilters[r].call(l,o,c,l.opts))return m(n.stop)&&(S._queueHooks(l.elem,l.opts.queue).stop=n.stop.bind(n)),n;return S.map(c,ct,l),m(l.opts.start)&&l.opts.start.call(o,l),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always),S.fx.timer(S.extend(u,{elem:o,anim:l,queue:l.opts.queue})),l}S.Animation=S.extend(ft,{tweeners:{"*":[function(e,t){var n=this.createTween(e,t);return se(n.elem,e,te.exec(t),n),n}]},tweener:function(e,t){m(e)?(t=e,e=["*"]):e=e.match(P);for(var n,r=0,i=e.length;r<i;r++)n=e[r],ft.tweeners[n]=ft.tweeners[n]||[],ft.tweeners[n].unshift(t)},prefilters:[function(e,t,n){var r,i,o,a,s,u,l,c,f="width"in t||"height"in t,p=this,d={},h=e.style,g=e.nodeType&&ae(e),v=Y.get(e,"fxshow");for(r in n.queue||(null==(a=S._queueHooks(e,"fx")).unqueued&&(a.unqueued=0,s=a.empty.fire,a.empty.fire=function(){a.unqueued||s()}),a.unqueued++,p.always(function(){p.always(function(){a.unqueued--,S.queue(e,"fx").length||a.empty.fire()})})),t)if(i=t[r],ot.test(i)){if(delete t[r],o=o||"toggle"===i,i===(g?"hide":"show")){if("show"!==i||!v||void 0===v[r])continue;g=!0}d[r]=v&&v[r]||S.style(e,r)}if((u=!S.isEmptyObject(t))||!S.isEmptyObject(d))for(r in f&&1===e.nodeType&&(n.overflow=[h.overflow,h.overflowX,h.overflowY],null==(l=v&&v.display)&&(l=Y.get(e,"display")),"none"===(c=S.css(e,"display"))&&(l?c=l:(le([e],!0),l=e.style.display||l,c=S.css(e,"display"),le([e]))),("inline"===c||"inline-block"===c&&null!=l)&&"none"===S.css(e,"float")&&(u||(p.done(function(){h.display=l}),null==l&&(c=h.display,l="none"===c?"":c)),h.display="inline-block")),n.overflow&&(h.overflow="hidden",p.always(function(){h.overflow=n.overflow[0],h.overflowX=n.overflow[1],h.overflowY=n.overflow[2]})),u=!1,d)u||(v?"hidden"in v&&(g=v.hidden):v=Y.access(e,"fxshow",{display:l}),o&&(v.hidden=!g),g&&le([e],!0),p.done(function(){for(r in g||le([e]),Y.remove(e,"fxshow"),d)S.style(e,r,d[r])})),u=ct(g?v[r]:0,r,p),r in v||(v[r]=u.start,g&&(u.end=u.start,u.start=0))}],prefilter:function(e,t){t?ft.prefilters.unshift(e):ft.prefilters.push(e)}}),S.speed=function(e,t,n){var r=e&&"object"==typeof e?S.extend({},e):{complete:n||!n&&t||m(e)&&e,duration:e,easing:n&&t||t&&!m(t)&&t};return S.fx.off?r.duration=0:"number"!=typeof r.duration&&(r.duration in S.fx.speeds?r.duration=S.fx.speeds[r.duration]:r.duration=S.fx.speeds._default),null!=r.queue&&!0!==r.queue||(r.queue="fx"),r.old=r.complete,r.complete=function(){m(r.old)&&r.old.call(this),r.queue&&S.dequeue(this,r.queue)},r},S.fn.extend({fadeTo:function(e,t,n,r){return this.filter(ae).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(t,e,n,r){var i=S.isEmptyObject(t),o=S.speed(e,n,r),a=function(){var e=ft(this,S.extend({},t),o);(i||Y.get(this,"finish"))&&e.stop(!0)};return a.finish=a,i||!1===o.queue?this.each(a):this.queue(o.queue,a)},stop:function(i,e,o){var a=function(e){var t=e.stop;delete e.stop,t(o)};return"string"!=typeof i&&(o=e,e=i,i=void 0),e&&this.queue(i||"fx",[]),this.each(function(){var e=!0,t=null!=i&&i+"queueHooks",n=S.timers,r=Y.get(this);if(t)r[t]&&r[t].stop&&a(r[t]);else for(t in r)r[t]&&r[t].stop&&at.test(t)&&a(r[t]);for(t=n.length;t--;)n[t].elem!==this||null!=i&&n[t].queue!==i||(n[t].anim.stop(o),e=!1,n.splice(t,1));!e&&o||S.dequeue(this,i)})},finish:function(a){return!1!==a&&(a=a||"fx"),this.each(function(){var e,t=Y.get(this),n=t[a+"queue"],r=t[a+"queueHooks"],i=S.timers,o=n?n.length:0;for(t.finish=!0,S.queue(this,a,[]),r&&r.stop&&r.stop.call(this,!0),e=i.length;e--;)i[e].elem===this&&i[e].queue===a&&(i[e].anim.stop(!0),i.splice(e,1));for(e=0;e<o;e++)n[e]&&n[e].finish&&n[e].finish.call(this);delete t.finish})}}),S.each(["toggle","show","hide"],function(e,r){var i=S.fn[r];S.fn[r]=function(e,t,n){return null==e||"boolean"==typeof e?i.apply(this,arguments):this.animate(lt(r,!0),e,t,n)}}),S.each({slideDown:lt("show"),slideUp:lt("hide"),slideToggle:lt("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,r){S.fn[e]=function(e,t,n){return this.animate(r,e,t,n)}}),S.timers=[],S.fx.tick=function(){var e,t=0,n=S.timers;for(tt=Date.now();t<n.length;t++)(e=n[t])()||n[t]!==e||n.splice(t--,1);n.length||S.fx.stop(),tt=void 0},S.fx.timer=function(e){S.timers.push(e),S.fx.start()},S.fx.interval=13,S.fx.start=function(){nt||(nt=!0,st())},S.fx.stop=function(){nt=null},S.fx.speeds={slow:600,fast:200,_default:400},S.fn.delay=function(r,e){return r=S.fx&&S.fx.speeds[r]||r,e=e||"fx",this.queue(e,function(e,t){var n=C.setTimeout(e,r);t.stop=function(){C.clearTimeout(n)}})},rt=E.createElement("input"),it=E.createElement("select").appendChild(E.createElement("option")),rt.type="checkbox",y.checkOn=""!==rt.value,y.optSelected=it.selected,(rt=E.createElement("input")).value="t",rt.type="radio",y.radioValue="t"===rt.value;var pt,dt=S.expr.attrHandle;S.fn.extend({attr:function(e,t){return $(this,S.attr,e,t,1<arguments.length)},removeAttr:function(e){return this.each(function(){S.removeAttr(this,e)})}}),S.extend({attr:function(e,t,n){var r,i,o=e.nodeType;if(3!==o&&8!==o&&2!==o)return"undefined"==typeof e.getAttribute?S.prop(e,t,n):(1===o&&S.isXMLDoc(e)||(i=S.attrHooks[t.toLowerCase()]||(S.expr.match.bool.test(t)?pt:void 0)),void 0!==n?null===n?void S.removeAttr(e,t):i&&"set"in i&&void 0!==(r=i.set(e,n,t))?r:(e.setAttribute(t,n+""),n):i&&"get"in i&&null!==(r=i.get(e,t))?r:null==(r=S.find.attr(e,t))?void 0:r)},attrHooks:{type:{set:function(e,t){if(!y.radioValue&&"radio"===t&&A(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},removeAttr:function(e,t){var n,r=0,i=t&&t.match(P);if(i&&1===e.nodeType)while(n=i[r++])e.removeAttribute(n)}}),pt={set:function(e,t,n){return!1===t?S.removeAttr(e,n):e.setAttribute(n,n),n}},S.each(S.expr.match.bool.source.match(/\w+/g),function(e,t){var a=dt[t]||S.find.attr;dt[t]=function(e,t,n){var r,i,o=t.toLowerCase();return n||(i=dt[o],dt[o]=r,r=null!=a(e,t,n)?o:null,dt[o]=i),r}});var ht=/^(?:input|select|textarea|button)$/i,gt=/^(?:a|area)$/i;function vt(e){return(e.match(P)||[]).join(" ")}function yt(e){return e.getAttribute&&e.getAttribute("class")||""}function mt(e){return Array.isArray(e)?e:"string"==typeof e&&e.match(P)||[]}S.fn.extend({prop:function(e,t){return $(this,S.prop,e,t,1<arguments.length)},removeProp:function(e){return this.each(function(){delete this[S.propFix[e]||e]})}}),S.extend({prop:function(e,t,n){var r,i,o=e.nodeType;if(3!==o&&8!==o&&2!==o)return 1===o&&S.isXMLDoc(e)||(t=S.propFix[t]||t,i=S.propHooks[t]),void 0!==n?i&&"set"in i&&void 0!==(r=i.set(e,n,t))?r:e[t]=n:i&&"get"in i&&null!==(r=i.get(e,t))?r:e[t]},propHooks:{tabIndex:{get:function(e){var t=S.find.attr(e,"tabindex");return t?parseInt(t,10):ht.test(e.nodeName)||gt.test(e.nodeName)&&e.href?0:-1}}},propFix:{"for":"htmlFor","class":"className"}}),y.optSelected||(S.propHooks.selected={get:function(e){var t=e.parentNode;return t&&t.parentNode&&t.parentNode.selectedIndex,null},set:function(e){var t=e.parentNode;t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex)}}),S.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){S.propFix[this.toLowerCase()]=this}),S.fn.extend({addClass:function(t){var e,n,r,i,o,a,s,u=0;if(m(t))return this.each(function(e){S(this).addClass(t.call(this,e,yt(this)))});if((e=mt(t)).length)while(n=this[u++])if(i=yt(n),r=1===n.nodeType&&" "+vt(i)+" "){a=0;while(o=e[a++])r.indexOf(" "+o+" ")<0&&(r+=o+" ");i!==(s=vt(r))&&n.setAttribute("class",s)}return this},removeClass:function(t){var e,n,r,i,o,a,s,u=0;if(m(t))return this.each(function(e){S(this).removeClass(t.call(this,e,yt(this)))});if(!arguments.length)return this.attr("class","");if((e=mt(t)).length)while(n=this[u++])if(i=yt(n),r=1===n.nodeType&&" "+vt(i)+" "){a=0;while(o=e[a++])while(-1<r.indexOf(" "+o+" "))r=r.replace(" "+o+" "," ");i!==(s=vt(r))&&n.setAttribute("class",s)}return this},toggleClass:function(i,t){var o=typeof i,a="string"===o||Array.isArray(i);return"boolean"==typeof t&&a?t?this.addClass(i):this.removeClass(i):m(i)?this.each(function(e){S(this).toggleClass(i.call(this,e,yt(this),t),t)}):this.each(function(){var e,t,n,r;if(a){t=0,n=S(this),r=mt(i);while(e=r[t++])n.hasClass(e)?n.removeClass(e):n.addClass(e)}else void 0!==i&&"boolean"!==o||((e=yt(this))&&Y.set(this,"__className__",e),this.setAttribute&&this.setAttribute("class",e||!1===i?"":Y.get(this,"__className__")||""))})},hasClass:function(e){var t,n,r=0;t=" "+e+" ";while(n=this[r++])if(1===n.nodeType&&-1<(" "+vt(yt(n))+" ").indexOf(t))return!0;return!1}});var xt=/\r/g;S.fn.extend({val:function(n){var r,e,i,t=this[0];return arguments.length?(i=m(n),this.each(function(e){var t;1===this.nodeType&&(null==(t=i?n.call(this,e,S(this).val()):n)?t="":"number"==typeof t?t+="":Array.isArray(t)&&(t=S.map(t,function(e){return null==e?"":e+""})),(r=S.valHooks[this.type]||S.valHooks[this.nodeName.toLowerCase()])&&"set"in r&&void 0!==r.set(this,t,"value")||(this.value=t))})):t?(r=S.valHooks[t.type]||S.valHooks[t.nodeName.toLowerCase()])&&"get"in r&&void 0!==(e=r.get(t,"value"))?e:"string"==typeof(e=t.value)?e.replace(xt,""):null==e?"":e:void 0}}),S.extend({valHooks:{option:{get:function(e){var t=S.find.attr(e,"value");return null!=t?t:vt(S.text(e))}},select:{get:function(e){var t,n,r,i=e.options,o=e.selectedIndex,a="select-one"===e.type,s=a?null:[],u=a?o+1:i.length;for(r=o<0?u:a?o:0;r<u;r++)if(((n=i[r]).selected||r===o)&&!n.disabled&&(!n.parentNode.disabled||!A(n.parentNode,"optgroup"))){if(t=S(n).val(),a)return t;s.push(t)}return s},set:function(e,t){var n,r,i=e.options,o=S.makeArray(t),a=i.length;while(a--)((r=i[a]).selected=-1<S.inArray(S.valHooks.option.get(r),o))&&(n=!0);return n||(e.selectedIndex=-1),o}}}}),S.each(["radio","checkbox"],function(){S.valHooks[this]={set:function(e,t){if(Array.isArray(t))return e.checked=-1<S.inArray(S(e).val(),t)}},y.checkOn||(S.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})}),y.focusin="onfocusin"in C;var bt=/^(?:focusinfocus|focusoutblur)$/,wt=function(e){e.stopPropagation()};S.extend(S.event,{trigger:function(e,t,n,r){var i,o,a,s,u,l,c,f,p=[n||E],d=v.call(e,"type")?e.type:e,h=v.call(e,"namespace")?e.namespace.split("."):[];if(o=f=a=n=n||E,3!==n.nodeType&&8!==n.nodeType&&!bt.test(d+S.event.triggered)&&(-1<d.indexOf(".")&&(d=(h=d.split(".")).shift(),h.sort()),u=d.indexOf(":")<0&&"on"+d,(e=e[S.expando]?e:new S.Event(d,"object"==typeof e&&e)).isTrigger=r?2:3,e.namespace=h.join("."),e.rnamespace=e.namespace?new RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,e.result=void 0,e.target||(e.target=n),t=null==t?[e]:S.makeArray(t,[e]),c=S.event.special[d]||{},r||!c.trigger||!1!==c.trigger.apply(n,t))){if(!r&&!c.noBubble&&!x(n)){for(s=c.delegateType||d,bt.test(s+d)||(o=o.parentNode);o;o=o.parentNode)p.push(o),a=o;a===(n.ownerDocument||E)&&p.push(a.defaultView||a.parentWindow||C)}i=0;while((o=p[i++])&&!e.isPropagationStopped())f=o,e.type=1<i?s:c.bindType||d,(l=(Y.get(o,"events")||Object.create(null))[e.type]&&Y.get(o,"handle"))&&l.apply(o,t),(l=u&&o[u])&&l.apply&&V(o)&&(e.result=l.apply(o,t),!1===e.result&&e.preventDefault());return e.type=d,r||e.isDefaultPrevented()||c._default&&!1!==c._default.apply(p.pop(),t)||!V(n)||u&&m(n[d])&&!x(n)&&((a=n[u])&&(n[u]=null),S.event.triggered=d,e.isPropagationStopped()&&f.addEventListener(d,wt),n[d](),e.isPropagationStopped()&&f.removeEventListener(d,wt),S.event.triggered=void 0,a&&(n[u]=a)),e.result}},simulate:function(e,t,n){var r=S.extend(new S.Event,n,{type:e,isSimulated:!0});S.event.trigger(r,null,t)}}),S.fn.extend({trigger:function(e,t){return this.each(function(){S.event.trigger(e,t,this)})},triggerHandler:function(e,t){var n=this[0];if(n)return S.event.trigger(e,t,n,!0)}}),y.focusin||S.each({focus:"focusin",blur:"focusout"},function(n,r){var i=function(e){S.event.simulate(r,e.target,S.event.fix(e))};S.event.special[r]={setup:function(){var e=this.ownerDocument||this.document||this,t=Y.access(e,r);t||e.addEventListener(n,i,!0),Y.access(e,r,(t||0)+1)},teardown:function(){var e=this.ownerDocument||this.document||this,t=Y.access(e,r)-1;t?Y.access(e,r,t):(e.removeEventListener(n,i,!0),Y.remove(e,r))}}});var Tt=C.location,Ct={guid:Date.now()},Et=/\?/;S.parseXML=function(e){var t;if(!e||"string"!=typeof e)return null;try{t=(new C.DOMParser).parseFromString(e,"text/xml")}catch(e){t=void 0}return t&&!t.getElementsByTagName("parsererror").length||S.error("Invalid XML: "+e),t};var St=/\[\]$/,kt=/\r?\n/g,At=/^(?:submit|button|image|reset|file)$/i,Nt=/^(?:input|select|textarea|keygen)/i;function Dt(n,e,r,i){var t;if(Array.isArray(e))S.each(e,function(e,t){r||St.test(n)?i(n,t):Dt(n+"["+("object"==typeof t&&null!=t?e:"")+"]",t,r,i)});else if(r||"object"!==w(e))i(n,e);else for(t in e)Dt(n+"["+t+"]",e[t],r,i)}S.param=function(e,t){var n,r=[],i=function(e,t){var n=m(t)?t():t;r[r.length]=encodeURIComponent(e)+"="+encodeURIComponent(null==n?"":n)};if(null==e)return"";if(Array.isArray(e)||e.jquery&&!S.isPlainObject(e))S.each(e,function(){i(this.name,this.value)});else for(n in e)Dt(n,e[n],t,i);return r.join("&")},S.fn.extend({serialize:function(){return S.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=S.prop(this,"elements");return e?S.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!S(this).is(":disabled")&&Nt.test(this.nodeName)&&!At.test(e)&&(this.checked||!pe.test(e))}).map(function(e,t){var n=S(this).val();return null==n?null:Array.isArray(n)?S.map(n,function(e){return{name:t.name,value:e.replace(kt,"\r\n")}}):{name:t.name,value:n.replace(kt,"\r\n")}}).get()}});var jt=/%20/g,qt=/#.*$/,Lt=/([?&])_=[^&]*/,Ht=/^(.*?):[ \t]*([^\r\n]*)$/gm,Ot=/^(?:GET|HEAD)$/,Pt=/^\/\//,Rt={},Mt={},It="*/".concat("*"),Wt=E.createElement("a");function Ft(o){return function(e,t){"string"!=typeof e&&(t=e,e="*");var n,r=0,i=e.toLowerCase().match(P)||[];if(m(t))while(n=i[r++])"+"===n[0]?(n=n.slice(1)||"*",(o[n]=o[n]||[]).unshift(t)):(o[n]=o[n]||[]).push(t)}}function Bt(t,i,o,a){var s={},u=t===Mt;function l(e){var r;return s[e]=!0,S.each(t[e]||[],function(e,t){var n=t(i,o,a);return"string"!=typeof n||u||s[n]?u?!(r=n):void 0:(i.dataTypes.unshift(n),l(n),!1)}),r}return l(i.dataTypes[0])||!s["*"]&&l("*")}function $t(e,t){var n,r,i=S.ajaxSettings.flatOptions||{};for(n in t)void 0!==t[n]&&((i[n]?e:r||(r={}))[n]=t[n]);return r&&S.extend(!0,e,r),e}Wt.href=Tt.href,S.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:Tt.href,type:"GET",isLocal:/^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(Tt.protocol),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":It,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/\bxml\b/,html:/\bhtml/,json:/\bjson\b/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":JSON.parse,"text xml":S.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?$t($t(e,S.ajaxSettings),t):$t(S.ajaxSettings,e)},ajaxPrefilter:Ft(Rt),ajaxTransport:Ft(Mt),ajax:function(e,t){"object"==typeof e&&(t=e,e=void 0),t=t||{};var c,f,p,n,d,r,h,g,i,o,v=S.ajaxSetup({},t),y=v.context||v,m=v.context&&(y.nodeType||y.jquery)?S(y):S.event,x=S.Deferred(),b=S.Callbacks("once memory"),w=v.statusCode||{},a={},s={},u="canceled",T={readyState:0,getResponseHeader:function(e){var t;if(h){if(!n){n={};while(t=Ht.exec(p))n[t[1].toLowerCase()+" "]=(n[t[1].toLowerCase()+" "]||[]).concat(t[2])}t=n[e.toLowerCase()+" "]}return null==t?null:t.join(", ")},getAllResponseHeaders:function(){return h?p:null},setRequestHeader:function(e,t){return null==h&&(e=s[e.toLowerCase()]=s[e.toLowerCase()]||e,a[e]=t),this},overrideMimeType:function(e){return null==h&&(v.mimeType=e),this},statusCode:function(e){var t;if(e)if(h)T.always(e[T.status]);else for(t in e)w[t]=[w[t],e[t]];return this},abort:function(e){var t=e||u;return c&&c.abort(t),l(0,t),this}};if(x.promise(T),v.url=((e||v.url||Tt.href)+"").replace(Pt,Tt.protocol+"//"),v.type=t.method||t.type||v.method||v.type,v.dataTypes=(v.dataType||"*").toLowerCase().match(P)||[""],null==v.crossDomain){r=E.createElement("a");try{r.href=v.url,r.href=r.href,v.crossDomain=Wt.protocol+"//"+Wt.host!=r.protocol+"//"+r.host}catch(e){v.crossDomain=!0}}if(v.data&&v.processData&&"string"!=typeof v.data&&(v.data=S.param(v.data,v.traditional)),Bt(Rt,v,t,T),h)return T;for(i in(g=S.event&&v.global)&&0==S.active++&&S.event.trigger("ajaxStart"),v.type=v.type.toUpperCase(),v.hasContent=!Ot.test(v.type),f=v.url.replace(qt,""),v.hasContent?v.data&&v.processData&&0===(v.contentType||"").indexOf("application/x-www-form-urlencoded")&&(v.data=v.data.replace(jt,"+")):(o=v.url.slice(f.length),v.data&&(v.processData||"string"==typeof v.data)&&(f+=(Et.test(f)?"&":"?")+v.data,delete v.data),!1===v.cache&&(f=f.replace(Lt,"$1"),o=(Et.test(f)?"&":"?")+"_="+Ct.guid+++o),v.url=f+o),v.ifModified&&(S.lastModified[f]&&T.setRequestHeader("If-Modified-Since",S.lastModified[f]),S.etag[f]&&T.setRequestHeader("If-None-Match",S.etag[f])),(v.data&&v.hasContent&&!1!==v.contentType||t.contentType)&&T.setRequestHeader("Content-Type",v.contentType),T.setRequestHeader("Accept",v.dataTypes[0]&&v.accepts[v.dataTypes[0]]?v.accepts[v.dataTypes[0]]+("*"!==v.dataTypes[0]?", "+It+"; q=0.01":""):v.accepts["*"]),v.headers)T.setRequestHeader(i,v.headers[i]);if(v.beforeSend&&(!1===v.beforeSend.call(y,T,v)||h))return T.abort();if(u="abort",b.add(v.complete),T.done(v.success),T.fail(v.error),c=Bt(Mt,v,t,T)){if(T.readyState=1,g&&m.trigger("ajaxSend",[T,v]),h)return T;v.async&&0<v.timeout&&(d=C.setTimeout(function(){T.abort("timeout")},v.timeout));try{h=!1,c.send(a,l)}catch(e){if(h)throw e;l(-1,e)}}else l(-1,"No Transport");function l(e,t,n,r){var i,o,a,s,u,l=t;h||(h=!0,d&&C.clearTimeout(d),c=void 0,p=r||"",T.readyState=0<e?4:0,i=200<=e&&e<300||304===e,n&&(s=function(e,t,n){var r,i,o,a,s=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),void 0===r&&(r=e.mimeType||t.getResponseHeader("Content-Type"));if(r)for(i in s)if(s[i]&&s[i].test(r)){u.unshift(i);break}if(u[0]in n)o=u[0];else{for(i in n){if(!u[0]||e.converters[i+" "+u[0]]){o=i;break}a||(a=i)}o=o||a}if(o)return o!==u[0]&&u.unshift(o),n[o]}(v,T,n)),!i&&-1<S.inArray("script",v.dataTypes)&&(v.converters["text script"]=function(){}),s=function(e,t,n,r){var i,o,a,s,u,l={},c=e.dataTypes.slice();if(c[1])for(a in e.converters)l[a.toLowerCase()]=e.converters[a];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!u&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u=o,o=c.shift())if("*"===o)o=u;else if("*"!==u&&u!==o){if(!(a=l[u+" "+o]||l["* "+o]))for(i in l)if((s=i.split(" "))[1]===o&&(a=l[u+" "+s[0]]||l["* "+s[0]])){!0===a?a=l[i]:!0!==l[i]&&(o=s[0],c.unshift(s[1]));break}if(!0!==a)if(a&&e["throws"])t=a(t);else try{t=a(t)}catch(e){return{state:"parsererror",error:a?e:"No conversion from "+u+" to "+o}}}return{state:"success",data:t}}(v,s,T,i),i?(v.ifModified&&((u=T.getResponseHeader("Last-Modified"))&&(S.lastModified[f]=u),(u=T.getResponseHeader("etag"))&&(S.etag[f]=u)),204===e||"HEAD"===v.type?l="nocontent":304===e?l="notmodified":(l=s.state,o=s.data,i=!(a=s.error))):(a=l,!e&&l||(l="error",e<0&&(e=0))),T.status=e,T.statusText=(t||l)+"",i?x.resolveWith(y,[o,l,T]):x.rejectWith(y,[T,l,a]),T.statusCode(w),w=void 0,g&&m.trigger(i?"ajaxSuccess":"ajaxError",[T,v,i?o:a]),b.fireWith(y,[T,l]),g&&(m.trigger("ajaxComplete",[T,v]),--S.active||S.event.trigger("ajaxStop")))}return T},getJSON:function(e,t,n){return S.get(e,t,n,"json")},getScript:function(e,t){return S.get(e,void 0,t,"script")}}),S.each(["get","post"],function(e,i){S[i]=function(e,t,n,r){return m(t)&&(r=r||n,n=t,t=void 0),S.ajax(S.extend({url:e,type:i,dataType:r,data:t,success:n},S.isPlainObject(e)&&e))}}),S.ajaxPrefilter(function(e){var t;for(t in e.headers)"content-type"===t.toLowerCase()&&(e.contentType=e.headers[t]||"")}),S._evalUrl=function(e,t,n){return S.ajax({url:e,type:"GET",dataType:"script",cache:!0,async:!1,global:!1,converters:{"text script":function(){}},dataFilter:function(e){S.globalEval(e,t,n)}})},S.fn.extend({wrapAll:function(e){var t;return this[0]&&(m(e)&&(e=e.call(this[0])),t=S(e,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstElementChild)e=e.firstElementChild;return e}).append(this)),this},wrapInner:function(n){return m(n)?this.each(function(e){S(this).wrapInner(n.call(this,e))}):this.each(function(){var e=S(this),t=e.contents();t.length?t.wrapAll(n):e.append(n)})},wrap:function(t){var n=m(t);return this.each(function(e){S(this).wrapAll(n?t.call(this,e):t)})},unwrap:function(e){return this.parent(e).not("body").each(function(){S(this).replaceWith(this.childNodes)}),this}}),S.expr.pseudos.hidden=function(e){return!S.expr.pseudos.visible(e)},S.expr.pseudos.visible=function(e){return!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)},S.ajaxSettings.xhr=function(){try{return new C.XMLHttpRequest}catch(e){}};var _t={0:200,1223:204},zt=S.ajaxSettings.xhr();y.cors=!!zt&&"withCredentials"in zt,y.ajax=zt=!!zt,S.ajaxTransport(function(i){var o,a;if(y.cors||zt&&!i.crossDomain)return{send:function(e,t){var n,r=i.xhr();if(r.open(i.type,i.url,i.async,i.username,i.password),i.xhrFields)for(n in i.xhrFields)r[n]=i.xhrFields[n];for(n in i.mimeType&&r.overrideMimeType&&r.overrideMimeType(i.mimeType),i.crossDomain||e["X-Requested-With"]||(e["X-Requested-With"]="XMLHttpRequest"),e)r.setRequestHeader(n,e[n]);o=function(e){return function(){o&&(o=a=r.onload=r.onerror=r.onabort=r.ontimeout=r.onreadystatechange=null,"abort"===e?r.abort():"error"===e?"number"!=typeof r.status?t(0,"error"):t(r.status,r.statusText):t(_t[r.status]||r.status,r.statusText,"text"!==(r.responseType||"text")||"string"!=typeof r.responseText?{binary:r.response}:{text:r.responseText},r.getAllResponseHeaders()))}},r.onload=o(),a=r.onerror=r.ontimeout=o("error"),void 0!==r.onabort?r.onabort=a:r.onreadystatechange=function(){4===r.readyState&&C.setTimeout(function(){o&&a()})},o=o("abort");try{r.send(i.hasContent&&i.data||null)}catch(e){if(o)throw e}},abort:function(){o&&o()}}}),S.ajaxPrefilter(function(e){e.crossDomain&&(e.contents.script=!1)}),S.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/\b(?:java|ecma)script\b/},converters:{"text script":function(e){return S.globalEval(e),e}}}),S.ajaxPrefilter("script",function(e){void 0===e.cache&&(e.cache=!1),e.crossDomain&&(e.type="GET")}),S.ajaxTransport("script",function(n){var r,i;if(n.crossDomain||n.scriptAttrs)return{send:function(e,t){r=S("<script>").attr(n.scriptAttrs||{}).prop({charset:n.scriptCharset,src:n.url}).on("load error",i=function(e){r.remove(),i=null,e&&t("error"===e.type?404:200,e.type)}),E.head.appendChild(r[0])},abort:function(){i&&i()}}});var Ut,Xt=[],Vt=/(=)\?(?=&|$)|\?\?/;S.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=Xt.pop()||S.expando+"_"+Ct.guid++;return this[e]=!0,e}}),S.ajaxPrefilter("json jsonp",function(e,t,n){var r,i,o,a=!1!==e.jsonp&&(Vt.test(e.url)?"url":"string"==typeof e.data&&0===(e.contentType||"").indexOf("application/x-www-form-urlencoded")&&Vt.test(e.data)&&"data");if(a||"jsonp"===e.dataTypes[0])return r=e.jsonpCallback=m(e.jsonpCallback)?e.jsonpCallback():e.jsonpCallback,a?e[a]=e[a].replace(Vt,"$1"+r):!1!==e.jsonp&&(e.url+=(Et.test(e.url)?"&":"?")+e.jsonp+"="+r),e.converters["script json"]=function(){return o||S.error(r+" was not called"),o[0]},e.dataTypes[0]="json",i=C[r],C[r]=function(){o=arguments},n.always(function(){void 0===i?S(C).removeProp(r):C[r]=i,e[r]&&(e.jsonpCallback=t.jsonpCallback,Xt.push(r)),o&&m(i)&&i(o[0]),o=i=void 0}),"script"}),y.createHTMLDocument=((Ut=E.implementation.createHTMLDocument("").body).innerHTML="<form></form><form></form>",2===Ut.childNodes.length),S.parseHTML=function(e,t,n){return"string"!=typeof e?[]:("boolean"==typeof t&&(n=t,t=!1),t||(y.createHTMLDocument?((r=(t=E.implementation.createHTMLDocument("")).createElement("base")).href=E.location.href,t.head.appendChild(r)):t=E),o=!n&&[],(i=N.exec(e))?[t.createElement(i[1])]:(i=xe([e],t,o),o&&o.length&&S(o).remove(),S.merge([],i.childNodes)));var r,i,o},S.fn.load=function(e,t,n){var r,i,o,a=this,s=e.indexOf(" ");return-1<s&&(r=vt(e.slice(s)),e=e.slice(0,s)),m(t)?(n=t,t=void 0):t&&"object"==typeof t&&(i="POST"),0<a.length&&S.ajax({url:e,type:i||"GET",dataType:"html",data:t}).done(function(e){o=arguments,a.html(r?S("<div>").append(S.parseHTML(e)).find(r):e)}).always(n&&function(e,t){a.each(function(){n.apply(this,o||[e.responseText,t,e])})}),this},S.expr.pseudos.animated=function(t){return S.grep(S.timers,function(e){return t===e.elem}).length},S.offset={setOffset:function(e,t,n){var r,i,o,a,s,u,l=S.css(e,"position"),c=S(e),f={};"static"===l&&(e.style.position="relative"),s=c.offset(),o=S.css(e,"top"),u=S.css(e,"left"),("absolute"===l||"fixed"===l)&&-1<(o+u).indexOf("auto")?(a=(r=c.position()).top,i=r.left):(a=parseFloat(o)||0,i=parseFloat(u)||0),m(t)&&(t=t.call(e,n,S.extend({},s))),null!=t.top&&(f.top=t.top-s.top+a),null!=t.left&&(f.left=t.left-s.left+i),"using"in t?t.using.call(e,f):("number"==typeof f.top&&(f.top+="px"),"number"==typeof f.left&&(f.left+="px"),c.css(f))}},S.fn.extend({offset:function(t){if(arguments.length)return void 0===t?this:this.each(function(e){S.offset.setOffset(this,t,e)});var e,n,r=this[0];return r?r.getClientRects().length?(e=r.getBoundingClientRect(),n=r.ownerDocument.defaultView,{top:e.top+n.pageYOffset,left:e.left+n.pageXOffset}):{top:0,left:0}:void 0},position:function(){if(this[0]){var e,t,n,r=this[0],i={top:0,left:0};if("fixed"===S.css(r,"position"))t=r.getBoundingClientRect();else{t=this.offset(),n=r.ownerDocument,e=r.offsetParent||n.documentElement;while(e&&(e===n.body||e===n.documentElement)&&"static"===S.css(e,"position"))e=e.parentNode;e&&e!==r&&1===e.nodeType&&((i=S(e).offset()).top+=S.css(e,"borderTopWidth",!0),i.left+=S.css(e,"borderLeftWidth",!0))}return{top:t.top-i.top-S.css(r,"marginTop",!0),left:t.left-i.left-S.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent;while(e&&"static"===S.css(e,"position"))e=e.offsetParent;return e||re})}}),S.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(t,i){var o="pageYOffset"===i;S.fn[t]=function(e){return $(this,function(e,t,n){var r;if(x(e)?r=e:9===e.nodeType&&(r=e.defaultView),void 0===n)return r?r[i]:e[t];r?r.scrollTo(o?r.pageXOffset:n,o?n:r.pageYOffset):e[t]=n},t,e,arguments.length)}}),S.each(["top","left"],function(e,n){S.cssHooks[n]=$e(y.pixelPosition,function(e,t){if(t)return t=Be(e,n),Me.test(t)?S(e).position()[n]+"px":t})}),S.each({Height:"height",Width:"width"},function(a,s){S.each({padding:"inner"+a,content:s,"":"outer"+a},function(r,o){S.fn[o]=function(e,t){var n=arguments.length&&(r||"boolean"!=typeof e),i=r||(!0===e||!0===t?"margin":"border");return $(this,function(e,t,n){var r;return x(e)?0===o.indexOf("outer")?e["inner"+a]:e.document.documentElement["client"+a]:9===e.nodeType?(r=e.documentElement,Math.max(e.body["scroll"+a],r["scroll"+a],e.body["offset"+a],r["offset"+a],r["client"+a])):void 0===n?S.css(e,t,i):S.style(e,t,n,i)},s,n?e:void 0,n)}})}),S.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){S.fn[t]=function(e){return this.on(t,e)}}),S.fn.extend({bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)},hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)}}),S.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),function(e,n){S.fn[n]=function(e,t){return 0<arguments.length?this.on(n,null,e,t):this.trigger(n)}});var Gt=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;S.proxy=function(e,t){var n,r,i;if("string"==typeof t&&(n=e[t],t=e,e=n),m(e))return r=s.call(arguments,2),(i=function(){return e.apply(t||this,r.concat(s.call(arguments)))}).guid=e.guid=e.guid||S.guid++,i},S.holdReady=function(e){e?S.readyWait++:S.ready(!0)},S.isArray=Array.isArray,S.parseJSON=JSON.parse,S.nodeName=A,S.isFunction=m,S.isWindow=x,S.camelCase=X,S.type=w,S.now=Date.now,S.isNumeric=function(e){var t=S.type(e);return("number"===t||"string"===t)&&!isNaN(e-parseFloat(e))},S.trim=function(e){return null==e?"":(e+"").replace(Gt,"")},"function"==typeof define&&define.amd&&define("jquery",[],function(){return S});var Yt=C.jQuery,Qt=C.$;return S.noConflict=function(e){return C.$===S&&(C.$=Qt),e&&C.jQuery===S&&(C.jQuery=Yt),S},"undefined"==typeof e&&(C.jQuery=C.$=S),S});

/*!
 * Bootstrap v3.4.1 (https://getbootstrap.com/)
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under the MIT license
 */
if("undefined"==typeof jQuery)throw new Error("Bootstrap's JavaScript requires jQuery");!function(t){"use strict";var e=jQuery.fn.jquery.split(" ")[0].split(".");if(e[0]<2&&e[1]<9||1==e[0]&&9==e[1]&&e[2]<1||3<e[0])throw new Error("Bootstrap's JavaScript requires jQuery version 1.9.1 or higher, but lower than version 4")}(),function(n){"use strict";n.fn.emulateTransitionEnd=function(t){var e=!1,i=this;n(this).one("bsTransitionEnd",function(){e=!0});return setTimeout(function(){e||n(i).trigger(n.support.transition.end)},t),this},n(function(){n.support.transition=function o(){var t=document.createElement("bootstrap"),e={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd otransitionend",transition:"transitionend"};for(var i in e)if(t.style[i]!==undefined)return{end:e[i]};return!1}(),n.support.transition&&(n.event.special.bsTransitionEnd={bindType:n.support.transition.end,delegateType:n.support.transition.end,handle:function(t){if(n(t.target).is(this))return t.handleObj.handler.apply(this,arguments)}})})}(jQuery),function(s){"use strict";var e='[data-dismiss="alert"]',a=function(t){s(t).on("click",e,this.close)};a.VERSION="3.4.1",a.TRANSITION_DURATION=150,a.prototype.close=function(t){var e=s(this),i=e.attr("data-target");i||(i=(i=e.attr("href"))&&i.replace(/.*(?=#[^\s]*$)/,"")),i="#"===i?[]:i;var o=s(document).find(i);function n(){o.detach().trigger("closed.bs.alert").remove()}t&&t.preventDefault(),o.length||(o=e.closest(".alert")),o.trigger(t=s.Event("close.bs.alert")),t.isDefaultPrevented()||(o.removeClass("in"),s.support.transition&&o.hasClass("fade")?o.one("bsTransitionEnd",n).emulateTransitionEnd(a.TRANSITION_DURATION):n())};var t=s.fn.alert;s.fn.alert=function o(i){return this.each(function(){var t=s(this),e=t.data("bs.alert");e||t.data("bs.alert",e=new a(this)),"string"==typeof i&&e[i].call(t)})},s.fn.alert.Constructor=a,s.fn.alert.noConflict=function(){return s.fn.alert=t,this},s(document).on("click.bs.alert.data-api",e,a.prototype.close)}(jQuery),function(s){"use strict";var n=function(t,e){this.$element=s(t),this.options=s.extend({},n.DEFAULTS,e),this.isLoading=!1};function i(o){return this.each(function(){var t=s(this),e=t.data("bs.button"),i="object"==typeof o&&o;e||t.data("bs.button",e=new n(this,i)),"toggle"==o?e.toggle():o&&e.setState(o)})}n.VERSION="3.4.1",n.DEFAULTS={loadingText:"loading..."},n.prototype.setState=function(t){var e="disabled",i=this.$element,o=i.is("input")?"val":"html",n=i.data();t+="Text",null==n.resetText&&i.data("resetText",i[o]()),setTimeout(s.proxy(function(){i[o](null==n[t]?this.options[t]:n[t]),"loadingText"==t?(this.isLoading=!0,i.addClass(e).attr(e,e).prop(e,!0)):this.isLoading&&(this.isLoading=!1,i.removeClass(e).removeAttr(e).prop(e,!1))},this),0)},n.prototype.toggle=function(){var t=!0,e=this.$element.closest('[data-toggle="buttons"]');if(e.length){var i=this.$element.find("input");"radio"==i.prop("type")?(i.prop("checked")&&(t=!1),e.find(".active").removeClass("active"),this.$element.addClass("active")):"checkbox"==i.prop("type")&&(i.prop("checked")!==this.$element.hasClass("active")&&(t=!1),this.$element.toggleClass("active")),i.prop("checked",this.$element.hasClass("active")),t&&i.trigger("change")}else this.$element.attr("aria-pressed",!this.$element.hasClass("active")),this.$element.toggleClass("active")};var t=s.fn.button;s.fn.button=i,s.fn.button.Constructor=n,s.fn.button.noConflict=function(){return s.fn.button=t,this},s(document).on("click.bs.button.data-api",'[data-toggle^="button"]',function(t){var e=s(t.target).closest(".btn");i.call(e,"toggle"),s(t.target).is('input[type="radio"], input[type="checkbox"]')||(t.preventDefault(),e.is("input,button")?e.trigger("focus"):e.find("input:visible,button:visible").first().trigger("focus"))}).on("focus.bs.button.data-api blur.bs.button.data-api",'[data-toggle^="button"]',function(t){s(t.target).closest(".btn").toggleClass("focus",/^focus(in)?$/.test(t.type))})}(jQuery),function(p){"use strict";var c=function(t,e){this.$element=p(t),this.$indicators=this.$element.find(".carousel-indicators"),this.options=e,this.paused=null,this.sliding=null,this.interval=null,this.$active=null,this.$items=null,this.options.keyboard&&this.$element.on("keydown.bs.carousel",p.proxy(this.keydown,this)),"hover"==this.options.pause&&!("ontouchstart"in document.documentElement)&&this.$element.on("mouseenter.bs.carousel",p.proxy(this.pause,this)).on("mouseleave.bs.carousel",p.proxy(this.cycle,this))};function r(n){return this.each(function(){var t=p(this),e=t.data("bs.carousel"),i=p.extend({},c.DEFAULTS,t.data(),"object"==typeof n&&n),o="string"==typeof n?n:i.slide;e||t.data("bs.carousel",e=new c(this,i)),"number"==typeof n?e.to(n):o?e[o]():i.interval&&e.pause().cycle()})}c.VERSION="3.4.1",c.TRANSITION_DURATION=600,c.DEFAULTS={interval:5e3,pause:"hover",wrap:!0,keyboard:!0},c.prototype.keydown=function(t){if(!/input|textarea/i.test(t.target.tagName)){switch(t.which){case 37:this.prev();break;case 39:this.next();break;default:return}t.preventDefault()}},c.prototype.cycle=function(t){return t||(this.paused=!1),this.interval&&clearInterval(this.interval),this.options.interval&&!this.paused&&(this.interval=setInterval(p.proxy(this.next,this),this.options.interval)),this},c.prototype.getItemIndex=function(t){return this.$items=t.parent().children(".item"),this.$items.index(t||this.$active)},c.prototype.getItemForDirection=function(t,e){var i=this.getItemIndex(e);if(("prev"==t&&0===i||"next"==t&&i==this.$items.length-1)&&!this.options.wrap)return e;var o=(i+("prev"==t?-1:1))%this.$items.length;return this.$items.eq(o)},c.prototype.to=function(t){var e=this,i=this.getItemIndex(this.$active=this.$element.find(".item.active"));if(!(t>this.$items.length-1||t<0))return this.sliding?this.$element.one("slid.bs.carousel",function(){e.to(t)}):i==t?this.pause().cycle():this.slide(i<t?"next":"prev",this.$items.eq(t))},c.prototype.pause=function(t){return t||(this.paused=!0),this.$element.find(".next, .prev").length&&p.support.transition&&(this.$element.trigger(p.support.transition.end),this.cycle(!0)),this.interval=clearInterval(this.interval),this},c.prototype.next=function(){if(!this.sliding)return this.slide("next")},c.prototype.prev=function(){if(!this.sliding)return this.slide("prev")},c.prototype.slide=function(t,e){var i=this.$element.find(".item.active"),o=e||this.getItemForDirection(t,i),n=this.interval,s="next"==t?"left":"right",a=this;if(o.hasClass("active"))return this.sliding=!1;var r=o[0],l=p.Event("slide.bs.carousel",{relatedTarget:r,direction:s});if(this.$element.trigger(l),!l.isDefaultPrevented()){if(this.sliding=!0,n&&this.pause(),this.$indicators.length){this.$indicators.find(".active").removeClass("active");var h=p(this.$indicators.children()[this.getItemIndex(o)]);h&&h.addClass("active")}var d=p.Event("slid.bs.carousel",{relatedTarget:r,direction:s});return p.support.transition&&this.$element.hasClass("slide")?(o.addClass(t),"object"==typeof o&&o.length&&o[0].offsetWidth,i.addClass(s),o.addClass(s),i.one("bsTransitionEnd",function(){o.removeClass([t,s].join(" ")).addClass("active"),i.removeClass(["active",s].join(" ")),a.sliding=!1,setTimeout(function(){a.$element.trigger(d)},0)}).emulateTransitionEnd(c.TRANSITION_DURATION)):(i.removeClass("active"),o.addClass("active"),this.sliding=!1,this.$element.trigger(d)),n&&this.cycle(),this}};var t=p.fn.carousel;p.fn.carousel=r,p.fn.carousel.Constructor=c,p.fn.carousel.noConflict=function(){return p.fn.carousel=t,this};var e=function(t){var e=p(this),i=e.attr("href");i&&(i=i.replace(/.*(?=#[^\s]+$)/,""));var o=e.attr("data-target")||i,n=p(document).find(o);if(n.hasClass("carousel")){var s=p.extend({},n.data(),e.data()),a=e.attr("data-slide-to");a&&(s.interval=!1),r.call(n,s),a&&n.data("bs.carousel").to(a),t.preventDefault()}};p(document).on("click.bs.carousel.data-api","[data-slide]",e).on("click.bs.carousel.data-api","[data-slide-to]",e),p(window).on("load",function(){p('[data-ride="carousel"]').each(function(){var t=p(this);r.call(t,t.data())})})}(jQuery),function(a){"use strict";var r=function(t,e){this.$element=a(t),this.options=a.extend({},r.DEFAULTS,e),this.$trigger=a('[data-toggle="collapse"][href="#'+t.id+'"],[data-toggle="collapse"][data-target="#'+t.id+'"]'),this.transitioning=null,this.options.parent?this.$parent=this.getParent():this.addAriaAndCollapsedClass(this.$element,this.$trigger),this.options.toggle&&this.toggle()};function n(t){var e,i=t.attr("data-target")||(e=t.attr("href"))&&e.replace(/.*(?=#[^\s]+$)/,"");return a(document).find(i)}function l(o){return this.each(function(){var t=a(this),e=t.data("bs.collapse"),i=a.extend({},r.DEFAULTS,t.data(),"object"==typeof o&&o);!e&&i.toggle&&/show|hide/.test(o)&&(i.toggle=!1),e||t.data("bs.collapse",e=new r(this,i)),"string"==typeof o&&e[o]()})}r.VERSION="3.4.1",r.TRANSITION_DURATION=350,r.DEFAULTS={toggle:!0},r.prototype.dimension=function(){return this.$element.hasClass("width")?"width":"height"},r.prototype.show=function(){if(!this.transitioning&&!this.$element.hasClass("in")){var t,e=this.$parent&&this.$parent.children(".panel").children(".in, .collapsing");if(!(e&&e.length&&(t=e.data("bs.collapse"))&&t.transitioning)){var i=a.Event("show.bs.collapse");if(this.$element.trigger(i),!i.isDefaultPrevented()){e&&e.length&&(l.call(e,"hide"),t||e.data("bs.collapse",null));var o=this.dimension();this.$element.removeClass("collapse").addClass("collapsing")[o](0).attr("aria-expanded",!0),this.$trigger.removeClass("collapsed").attr("aria-expanded",!0),this.transitioning=1;var n=function(){this.$element.removeClass("collapsing").addClass("collapse in")[o](""),this.transitioning=0,this.$element.trigger("shown.bs.collapse")};if(!a.support.transition)return n.call(this);var s=a.camelCase(["scroll",o].join("-"));this.$element.one("bsTransitionEnd",a.proxy(n,this)).emulateTransitionEnd(r.TRANSITION_DURATION)[o](this.$element[0][s])}}}},r.prototype.hide=function(){if(!this.transitioning&&this.$element.hasClass("in")){var t=a.Event("hide.bs.collapse");if(this.$element.trigger(t),!t.isDefaultPrevented()){var e=this.dimension();this.$element[e](this.$element[e]())[0].offsetHeight,this.$element.addClass("collapsing").removeClass("collapse in").attr("aria-expanded",!1),this.$trigger.addClass("collapsed").attr("aria-expanded",!1),this.transitioning=1;var i=function(){this.transitioning=0,this.$element.removeClass("collapsing").addClass("collapse").trigger("hidden.bs.collapse")};if(!a.support.transition)return i.call(this);this.$element[e](0).one("bsTransitionEnd",a.proxy(i,this)).emulateTransitionEnd(r.TRANSITION_DURATION)}}},r.prototype.toggle=function(){this[this.$element.hasClass("in")?"hide":"show"]()},r.prototype.getParent=function(){return a(document).find(this.options.parent).find('[data-toggle="collapse"][data-parent="'+this.options.parent+'"]').each(a.proxy(function(t,e){var i=a(e);this.addAriaAndCollapsedClass(n(i),i)},this)).end()},r.prototype.addAriaAndCollapsedClass=function(t,e){var i=t.hasClass("in");t.attr("aria-expanded",i),e.toggleClass("collapsed",!i).attr("aria-expanded",i)};var t=a.fn.collapse;a.fn.collapse=l,a.fn.collapse.Constructor=r,a.fn.collapse.noConflict=function(){return a.fn.collapse=t,this},a(document).on("click.bs.collapse.data-api",'[data-toggle="collapse"]',function(t){var e=a(this);e.attr("data-target")||t.preventDefault();var i=n(e),o=i.data("bs.collapse")?"toggle":e.data();l.call(i,o)})}(jQuery),function(a){"use strict";var r='[data-toggle="dropdown"]',o=function(t){a(t).on("click.bs.dropdown",this.toggle)};function l(t){var e=t.attr("data-target");e||(e=(e=t.attr("href"))&&/#[A-Za-z]/.test(e)&&e.replace(/.*(?=#[^\s]*$)/,""));var i="#"!==e?a(document).find(e):null;return i&&i.length?i:t.parent()}function s(o){o&&3===o.which||(a(".dropdown-backdrop").remove(),a(r).each(function(){var t=a(this),e=l(t),i={relatedTarget:this};e.hasClass("open")&&(o&&"click"==o.type&&/input|textarea/i.test(o.target.tagName)&&a.contains(e[0],o.target)||(e.trigger(o=a.Event("hide.bs.dropdown",i)),o.isDefaultPrevented()||(t.attr("aria-expanded","false"),e.removeClass("open").trigger(a.Event("hidden.bs.dropdown",i)))))}))}o.VERSION="3.4.1",o.prototype.toggle=function(t){var e=a(this);if(!e.is(".disabled, :disabled")){var i=l(e),o=i.hasClass("open");if(s(),!o){"ontouchstart"in document.documentElement&&!i.closest(".navbar-nav").length&&a(document.createElement("div")).addClass("dropdown-backdrop").insertAfter(a(this)).on("click",s);var n={relatedTarget:this};if(i.trigger(t=a.Event("show.bs.dropdown",n)),t.isDefaultPrevented())return;e.trigger("focus").attr("aria-expanded","true"),i.toggleClass("open").trigger(a.Event("shown.bs.dropdown",n))}return!1}},o.prototype.keydown=function(t){if(/(38|40|27|32)/.test(t.which)&&!/input|textarea/i.test(t.target.tagName)){var e=a(this);if(t.preventDefault(),t.stopPropagation(),!e.is(".disabled, :disabled")){var i=l(e),o=i.hasClass("open");if(!o&&27!=t.which||o&&27==t.which)return 27==t.which&&i.find(r).trigger("focus"),e.trigger("click");var n=i.find(".dropdown-menu li:not(.disabled):visible a");if(n.length){var s=n.index(t.target);38==t.which&&0<s&&s--,40==t.which&&s<n.length-1&&s++,~s||(s=0),n.eq(s).trigger("focus")}}}};var t=a.fn.dropdown;a.fn.dropdown=function e(i){return this.each(function(){var t=a(this),e=t.data("bs.dropdown");e||t.data("bs.dropdown",e=new o(this)),"string"==typeof i&&e[i].call(t)})},a.fn.dropdown.Constructor=o,a.fn.dropdown.noConflict=function(){return a.fn.dropdown=t,this},a(document).on("click.bs.dropdown.data-api",s).on("click.bs.dropdown.data-api",".dropdown form",function(t){t.stopPropagation()}).on("click.bs.dropdown.data-api",r,o.prototype.toggle).on("keydown.bs.dropdown.data-api",r,o.prototype.keydown).on("keydown.bs.dropdown.data-api",".dropdown-menu",o.prototype.keydown)}(jQuery),function(a){"use strict";var s=function(t,e){this.options=e,this.$body=a(document.body),this.$element=a(t),this.$dialog=this.$element.find(".modal-dialog"),this.$backdrop=null,this.isShown=null,this.originalBodyPad=null,this.scrollbarWidth=0,this.ignoreBackdropClick=!1,this.fixedContent=".navbar-fixed-top, .navbar-fixed-bottom",this.options.remote&&this.$element.find(".modal-content").load(this.options.remote,a.proxy(function(){this.$element.trigger("loaded.bs.modal")},this))};function r(o,n){return this.each(function(){var t=a(this),e=t.data("bs.modal"),i=a.extend({},s.DEFAULTS,t.data(),"object"==typeof o&&o);e||t.data("bs.modal",e=new s(this,i)),"string"==typeof o?e[o](n):i.show&&e.show(n)})}s.VERSION="3.4.1",s.TRANSITION_DURATION=300,s.BACKDROP_TRANSITION_DURATION=150,s.DEFAULTS={backdrop:!0,keyboard:!0,show:!0},s.prototype.toggle=function(t){return this.isShown?this.hide():this.show(t)},s.prototype.show=function(i){var o=this,t=a.Event("show.bs.modal",{relatedTarget:i});this.$element.trigger(t),this.isShown||t.isDefaultPrevented()||(this.isShown=!0,this.checkScrollbar(),this.setScrollbar(),this.$body.addClass("modal-open"),this.escape(),this.resize(),this.$element.on("click.dismiss.bs.modal",'[data-dismiss="modal"]',a.proxy(this.hide,this)),this.$dialog.on("mousedown.dismiss.bs.modal",function(){o.$element.one("mouseup.dismiss.bs.modal",function(t){a(t.target).is(o.$element)&&(o.ignoreBackdropClick=!0)})}),this.backdrop(function(){var t=a.support.transition&&o.$element.hasClass("fade");o.$element.parent().length||o.$element.appendTo(o.$body),o.$element.show().scrollTop(0),o.adjustDialog(),t&&o.$element[0].offsetWidth,o.$element.addClass("in"),o.enforceFocus();var e=a.Event("shown.bs.modal",{relatedTarget:i});t?o.$dialog.one("bsTransitionEnd",function(){o.$element.trigger("focus").trigger(e)}).emulateTransitionEnd(s.TRANSITION_DURATION):o.$element.trigger("focus").trigger(e)}))},s.prototype.hide=function(t){t&&t.preventDefault(),t=a.Event("hide.bs.modal"),this.$element.trigger(t),this.isShown&&!t.isDefaultPrevented()&&(this.isShown=!1,this.escape(),this.resize(),a(document).off("focusin.bs.modal"),this.$element.removeClass("in").off("click.dismiss.bs.modal").off("mouseup.dismiss.bs.modal"),this.$dialog.off("mousedown.dismiss.bs.modal"),a.support.transition&&this.$element.hasClass("fade")?this.$element.one("bsTransitionEnd",a.proxy(this.hideModal,this)).emulateTransitionEnd(s.TRANSITION_DURATION):this.hideModal())},s.prototype.enforceFocus=function(){a(document).off("focusin.bs.modal").on("focusin.bs.modal",a.proxy(function(t){document===t.target||this.$element[0]===t.target||this.$element.has(t.target).length||this.$element.trigger("focus")},this))},s.prototype.escape=function(){this.isShown&&this.options.keyboard?this.$element.on("keydown.dismiss.bs.modal",a.proxy(function(t){27==t.which&&this.hide()},this)):this.isShown||this.$element.off("keydown.dismiss.bs.modal")},s.prototype.resize=function(){this.isShown?a(window).on("resize.bs.modal",a.proxy(this.handleUpdate,this)):a(window).off("resize.bs.modal")},s.prototype.hideModal=function(){var t=this;this.$element.hide(),this.backdrop(function(){t.$body.removeClass("modal-open"),t.resetAdjustments(),t.resetScrollbar(),t.$element.trigger("hidden.bs.modal")})},s.prototype.removeBackdrop=function(){this.$backdrop&&this.$backdrop.remove(),this.$backdrop=null},s.prototype.backdrop=function(t){var e=this,i=this.$element.hasClass("fade")?"fade":"";if(this.isShown&&this.options.backdrop){var o=a.support.transition&&i;if(this.$backdrop=a(document.createElement("div")).addClass("modal-backdrop "+i).appendTo(this.$body),this.$element.on("click.dismiss.bs.modal",a.proxy(function(t){this.ignoreBackdropClick?this.ignoreBackdropClick=!1:t.target===t.currentTarget&&("static"==this.options.backdrop?this.$element[0].focus():this.hide())},this)),o&&this.$backdrop[0].offsetWidth,this.$backdrop.addClass("in"),!t)return;o?this.$backdrop.one("bsTransitionEnd",t).emulateTransitionEnd(s.BACKDROP_TRANSITION_DURATION):t()}else if(!this.isShown&&this.$backdrop){this.$backdrop.removeClass("in");var n=function(){e.removeBackdrop(),t&&t()};a.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one("bsTransitionEnd",n).emulateTransitionEnd(s.BACKDROP_TRANSITION_DURATION):n()}else t&&t()},s.prototype.handleUpdate=function(){this.adjustDialog()},s.prototype.adjustDialog=function(){var t=this.$element[0].scrollHeight>document.documentElement.clientHeight;this.$element.css({paddingLeft:!this.bodyIsOverflowing&&t?this.scrollbarWidth:"",paddingRight:this.bodyIsOverflowing&&!t?this.scrollbarWidth:""})},s.prototype.resetAdjustments=function(){this.$element.css({paddingLeft:"",paddingRight:""})},s.prototype.checkScrollbar=function(){var t=window.innerWidth;if(!t){var e=document.documentElement.getBoundingClientRect();t=e.right-Math.abs(e.left)}this.bodyIsOverflowing=document.body.clientWidth<t,this.scrollbarWidth=this.measureScrollbar()},s.prototype.setScrollbar=function(){var t=parseInt(this.$body.css("padding-right")||0,10);this.originalBodyPad=document.body.style.paddingRight||"";var n=this.scrollbarWidth;this.bodyIsOverflowing&&(this.$body.css("padding-right",t+n),a(this.fixedContent).each(function(t,e){var i=e.style.paddingRight,o=a(e).css("padding-right");a(e).data("padding-right",i).css("padding-right",parseFloat(o)+n+"px")}))},s.prototype.resetScrollbar=function(){this.$body.css("padding-right",this.originalBodyPad),a(this.fixedContent).each(function(t,e){var i=a(e).data("padding-right");a(e).removeData("padding-right"),e.style.paddingRight=i||""})},s.prototype.measureScrollbar=function(){var t=document.createElement("div");t.className="modal-scrollbar-measure",this.$body.append(t);var e=t.offsetWidth-t.clientWidth;return this.$body[0].removeChild(t),e};var t=a.fn.modal;a.fn.modal=r,a.fn.modal.Constructor=s,a.fn.modal.noConflict=function(){return a.fn.modal=t,this},a(document).on("click.bs.modal.data-api",'[data-toggle="modal"]',function(t){var e=a(this),i=e.attr("href"),o=e.attr("data-target")||i&&i.replace(/.*(?=#[^\s]+$)/,""),n=a(document).find(o),s=n.data("bs.modal")?"toggle":a.extend({remote:!/#/.test(i)&&i},n.data(),e.data());e.is("a")&&t.preventDefault(),n.one("show.bs.modal",function(t){t.isDefaultPrevented()||n.one("hidden.bs.modal",function(){e.is(":visible")&&e.trigger("focus")})}),r.call(n,s,this)})}(jQuery),function(g){"use strict";var o=["sanitize","whiteList","sanitizeFn"],a=["background","cite","href","itemtype","longdesc","poster","src","xlink:href"],t={"*":["class","dir","id","lang","role",/^aria-[\w-]*$/i],a:["target","href","title","rel"],area:[],b:[],br:[],col:[],code:[],div:[],em:[],hr:[],h1:[],h2:[],h3:[],h4:[],h5:[],h6:[],i:[],img:["src","alt","title","width","height"],li:[],ol:[],p:[],pre:[],s:[],small:[],span:[],sub:[],sup:[],strong:[],u:[],ul:[]},r=/^(?:(?:https?|mailto|ftp|tel|file):|[^&:/?#]*(?:[/?#]|$))/gi,l=/^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z0-9+/]+=*$/i;function u(t,e){var i=t.nodeName.toLowerCase();if(-1!==g.inArray(i,e))return-1===g.inArray(i,a)||Boolean(t.nodeValue.match(r)||t.nodeValue.match(l));for(var o=g(e).filter(function(t,e){return e instanceof RegExp}),n=0,s=o.length;n<s;n++)if(i.match(o[n]))return!0;return!1}function n(t,e,i){if(0===t.length)return t;if(i&&"function"==typeof i)return i(t);if(!document.implementation||!document.implementation.createHTMLDocument)return t;var o=document.implementation.createHTMLDocument("sanitization");o.body.innerHTML=t;for(var n=g.map(e,function(t,e){return e}),s=g(o.body).find("*"),a=0,r=s.length;a<r;a++){var l=s[a],h=l.nodeName.toLowerCase();if(-1!==g.inArray(h,n))for(var d=g.map(l.attributes,function(t){return t}),p=[].concat(e["*"]||[],e[h]||[]),c=0,f=d.length;c<f;c++)u(d[c],p)||l.removeAttribute(d[c].nodeName);else l.parentNode.removeChild(l)}return o.body.innerHTML}var m=function(t,e){this.type=null,this.options=null,this.enabled=null,this.timeout=null,this.hoverState=null,this.$element=null,this.inState=null,this.init("tooltip",t,e)};m.VERSION="3.4.1",m.TRANSITION_DURATION=150,m.DEFAULTS={animation:!0,placement:"top",selector:!1,template:'<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover focus",title:"",delay:0,html:!1,container:!1,viewport:{selector:"body",padding:0},sanitize:!0,sanitizeFn:null,whiteList:t},m.prototype.init=function(t,e,i){if(this.enabled=!0,this.type=t,this.$element=g(e),this.options=this.getOptions(i),this.$viewport=this.options.viewport&&g(document).find(g.isFunction(this.options.viewport)?this.options.viewport.call(this,this.$element):this.options.viewport.selector||this.options.viewport),this.inState={click:!1,hover:!1,focus:!1},this.$element[0]instanceof document.constructor&&!this.options.selector)throw new Error("`selector` option must be specified when initializing "+this.type+" on the window.document object!");for(var o=this.options.trigger.split(" "),n=o.length;n--;){var s=o[n];if("click"==s)this.$element.on("click."+this.type,this.options.selector,g.proxy(this.toggle,this));else if("manual"!=s){var a="hover"==s?"mouseenter":"focusin",r="hover"==s?"mouseleave":"focusout";this.$element.on(a+"."+this.type,this.options.selector,g.proxy(this.enter,this)),this.$element.on(r+"."+this.type,this.options.selector,g.proxy(this.leave,this))}}this.options.selector?this._options=g.extend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},m.prototype.getDefaults=function(){return m.DEFAULTS},m.prototype.getOptions=function(t){var e=this.$element.data();for(var i in e)e.hasOwnProperty(i)&&-1!==g.inArray(i,o)&&delete e[i];return(t=g.extend({},this.getDefaults(),e,t)).delay&&"number"==typeof t.delay&&(t.delay={show:t.delay,hide:t.delay}),t.sanitize&&(t.template=n(t.template,t.whiteList,t.sanitizeFn)),t},m.prototype.getDelegateOptions=function(){var i={},o=this.getDefaults();return this._options&&g.each(this._options,function(t,e){o[t]!=e&&(i[t]=e)}),i},m.prototype.enter=function(t){var e=t instanceof this.constructor?t:g(t.currentTarget).data("bs."+this.type);if(e||(e=new this.constructor(t.currentTarget,this.getDelegateOptions()),g(t.currentTarget).data("bs."+this.type,e)),t instanceof g.Event&&(e.inState["focusin"==t.type?"focus":"hover"]=!0),e.tip().hasClass("in")||"in"==e.hoverState)e.hoverState="in";else{if(clearTimeout(e.timeout),e.hoverState="in",!e.options.delay||!e.options.delay.show)return e.show();e.timeout=setTimeout(function(){"in"==e.hoverState&&e.show()},e.options.delay.show)}},m.prototype.isInStateTrue=function(){for(var t in this.inState)if(this.inState[t])return!0;return!1},m.prototype.leave=function(t){var e=t instanceof this.constructor?t:g(t.currentTarget).data("bs."+this.type);if(e||(e=new this.constructor(t.currentTarget,this.getDelegateOptions()),g(t.currentTarget).data("bs."+this.type,e)),t instanceof g.Event&&(e.inState["focusout"==t.type?"focus":"hover"]=!1),!e.isInStateTrue()){if(clearTimeout(e.timeout),e.hoverState="out",!e.options.delay||!e.options.delay.hide)return e.hide();e.timeout=setTimeout(function(){"out"==e.hoverState&&e.hide()},e.options.delay.hide)}},m.prototype.show=function(){var t=g.Event("show.bs."+this.type);if(this.hasContent()&&this.enabled){this.$element.trigger(t);var e=g.contains(this.$element[0].ownerDocument.documentElement,this.$element[0]);if(t.isDefaultPrevented()||!e)return;var i=this,o=this.tip(),n=this.getUID(this.type);this.setContent(),o.attr("id",n),this.$element.attr("aria-describedby",n),this.options.animation&&o.addClass("fade");var s="function"==typeof this.options.placement?this.options.placement.call(this,o[0],this.$element[0]):this.options.placement,a=/\s?auto?\s?/i,r=a.test(s);r&&(s=s.replace(a,"")||"top"),o.detach().css({top:0,left:0,display:"block"}).addClass(s).data("bs."+this.type,this),this.options.container?o.appendTo(g(document).find(this.options.container)):o.insertAfter(this.$element),this.$element.trigger("inserted.bs."+this.type);var l=this.getPosition(),h=o[0].offsetWidth,d=o[0].offsetHeight;if(r){var p=s,c=this.getPosition(this.$viewport);s="bottom"==s&&l.bottom+d>c.bottom?"top":"top"==s&&l.top-d<c.top?"bottom":"right"==s&&l.right+h>c.width?"left":"left"==s&&l.left-h<c.left?"right":s,o.removeClass(p).addClass(s)}var f=this.getCalculatedOffset(s,l,h,d);this.applyPlacement(f,s);var u=function(){var t=i.hoverState;i.$element.trigger("shown.bs."+i.type),i.hoverState=null,"out"==t&&i.leave(i)};g.support.transition&&this.$tip.hasClass("fade")?o.one("bsTransitionEnd",u).emulateTransitionEnd(m.TRANSITION_DURATION):u()}},m.prototype.applyPlacement=function(t,e){var i=this.tip(),o=i[0].offsetWidth,n=i[0].offsetHeight,s=parseInt(i.css("margin-top"),10),a=parseInt(i.css("margin-left"),10);isNaN(s)&&(s=0),isNaN(a)&&(a=0),t.top+=s,t.left+=a,g.offset.setOffset(i[0],g.extend({using:function(t){i.css({top:Math.round(t.top),left:Math.round(t.left)})}},t),0),i.addClass("in");var r=i[0].offsetWidth,l=i[0].offsetHeight;"top"==e&&l!=n&&(t.top=t.top+n-l);var h=this.getViewportAdjustedDelta(e,t,r,l);h.left?t.left+=h.left:t.top+=h.top;var d=/top|bottom/.test(e),p=d?2*h.left-o+r:2*h.top-n+l,c=d?"offsetWidth":"offsetHeight";i.offset(t),this.replaceArrow(p,i[0][c],d)},m.prototype.replaceArrow=function(t,e,i){this.arrow().css(i?"left":"top",50*(1-t/e)+"%").css(i?"top":"left","")},m.prototype.setContent=function(){var t=this.tip(),e=this.getTitle();this.options.html?(this.options.sanitize&&(e=n(e,this.options.whiteList,this.options.sanitizeFn)),t.find(".tooltip-inner").html(e)):t.find(".tooltip-inner").text(e),t.removeClass("fade in top bottom left right")},m.prototype.hide=function(t){var e=this,i=g(this.$tip),o=g.Event("hide.bs."+this.type);function n(){"in"!=e.hoverState&&i.detach(),e.$element&&e.$element.removeAttr("aria-describedby").trigger("hidden.bs."+e.type),t&&t()}if(this.$element.trigger(o),!o.isDefaultPrevented())return i.removeClass("in"),g.support.transition&&i.hasClass("fade")?i.one("bsTransitionEnd",n).emulateTransitionEnd(m.TRANSITION_DURATION):n(),this.hoverState=null,this},m.prototype.fixTitle=function(){var t=this.$element;(t.attr("title")||"string"!=typeof t.attr("data-original-title"))&&t.attr("data-original-title",t.attr("title")||"").attr("title","")},m.prototype.hasContent=function(){return this.getTitle()},m.prototype.getPosition=function(t){var e=(t=t||this.$element)[0],i="BODY"==e.tagName,o=e.getBoundingClientRect();null==o.width&&(o=g.extend({},o,{width:o.right-o.left,height:o.bottom-o.top}));var n=window.SVGElement&&e instanceof window.SVGElement,s=i?{top:0,left:0}:n?null:t.offset(),a={scroll:i?document.documentElement.scrollTop||document.body.scrollTop:t.scrollTop()},r=i?{width:g(window).width(),height:g(window).height()}:null;return g.extend({},o,a,r,s)},m.prototype.getCalculatedOffset=function(t,e,i,o){return"bottom"==t?{top:e.top+e.height,left:e.left+e.width/2-i/2}:"top"==t?{top:e.top-o,left:e.left+e.width/2-i/2}:"left"==t?{top:e.top+e.height/2-o/2,left:e.left-i}:{top:e.top+e.height/2-o/2,left:e.left+e.width}},m.prototype.getViewportAdjustedDelta=function(t,e,i,o){var n={top:0,left:0};if(!this.$viewport)return n;var s=this.options.viewport&&this.options.viewport.padding||0,a=this.getPosition(this.$viewport);if(/right|left/.test(t)){var r=e.top-s-a.scroll,l=e.top+s-a.scroll+o;r<a.top?n.top=a.top-r:l>a.top+a.height&&(n.top=a.top+a.height-l)}else{var h=e.left-s,d=e.left+s+i;h<a.left?n.left=a.left-h:d>a.right&&(n.left=a.left+a.width-d)}return n},m.prototype.getTitle=function(){var t=this.$element,e=this.options;return t.attr("data-original-title")||("function"==typeof e.title?e.title.call(t[0]):e.title)},m.prototype.getUID=function(t){for(;t+=~~(1e6*Math.random()),document.getElementById(t););return t},m.prototype.tip=function(){if(!this.$tip&&(this.$tip=g(this.options.template),1!=this.$tip.length))throw new Error(this.type+" `template` option must consist of exactly 1 top-level element!");return this.$tip},m.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".tooltip-arrow")},m.prototype.enable=function(){this.enabled=!0},m.prototype.disable=function(){this.enabled=!1},m.prototype.toggleEnabled=function(){this.enabled=!this.enabled},m.prototype.toggle=function(t){var e=this;t&&((e=g(t.currentTarget).data("bs."+this.type))||(e=new this.constructor(t.currentTarget,this.getDelegateOptions()),g(t.currentTarget).data("bs."+this.type,e))),t?(e.inState.click=!e.inState.click,e.isInStateTrue()?e.enter(e):e.leave(e)):e.tip().hasClass("in")?e.leave(e):e.enter(e)},m.prototype.destroy=function(){var t=this;clearTimeout(this.timeout),this.hide(function(){t.$element.off("."+t.type).removeData("bs."+t.type),t.$tip&&t.$tip.detach(),t.$tip=null,t.$arrow=null,t.$viewport=null,t.$element=null})},m.prototype.sanitizeHtml=function(t){return n(t,this.options.whiteList,this.options.sanitizeFn)};var e=g.fn.tooltip;g.fn.tooltip=function i(o){return this.each(function(){var t=g(this),e=t.data("bs.tooltip"),i="object"==typeof o&&o;!e&&/destroy|hide/.test(o)||(e||t.data("bs.tooltip",e=new m(this,i)),"string"==typeof o&&e[o]())})},g.fn.tooltip.Constructor=m,g.fn.tooltip.noConflict=function(){return g.fn.tooltip=e,this}}(jQuery),function(n){"use strict";var s=function(t,e){this.init("popover",t,e)};if(!n.fn.tooltip)throw new Error("Popover requires tooltip.js");s.VERSION="3.4.1",s.DEFAULTS=n.extend({},n.fn.tooltip.Constructor.DEFAULTS,{placement:"right",trigger:"click",content:"",template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'}),((s.prototype=n.extend({},n.fn.tooltip.Constructor.prototype)).constructor=s).prototype.getDefaults=function(){return s.DEFAULTS},s.prototype.setContent=function(){var t=this.tip(),e=this.getTitle(),i=this.getContent();if(this.options.html){var o=typeof i;this.options.sanitize&&(e=this.sanitizeHtml(e),"string"===o&&(i=this.sanitizeHtml(i))),t.find(".popover-title").html(e),t.find(".popover-content").children().detach().end()["string"===o?"html":"append"](i)}else t.find(".popover-title").text(e),t.find(".popover-content").children().detach().end().text(i);t.removeClass("fade top bottom left right in"),t.find(".popover-title").html()||t.find(".popover-title").hide()},s.prototype.hasContent=function(){return this.getTitle()||this.getContent()},s.prototype.getContent=function(){var t=this.$element,e=this.options;return t.attr("data-content")||("function"==typeof e.content?e.content.call(t[0]):e.content)},s.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".arrow")};var t=n.fn.popover;n.fn.popover=function e(o){return this.each(function(){var t=n(this),e=t.data("bs.popover"),i="object"==typeof o&&o;!e&&/destroy|hide/.test(o)||(e||t.data("bs.popover",e=new s(this,i)),"string"==typeof o&&e[o]())})},n.fn.popover.Constructor=s,n.fn.popover.noConflict=function(){return n.fn.popover=t,this}}(jQuery),function(s){"use strict";function n(t,e){this.$body=s(document.body),this.$scrollElement=s(t).is(document.body)?s(window):s(t),this.options=s.extend({},n.DEFAULTS,e),this.selector=(this.options.target||"")+" .nav li > a",this.offsets=[],this.targets=[],this.activeTarget=null,this.scrollHeight=0,this.$scrollElement.on("scroll.bs.scrollspy",s.proxy(this.process,this)),this.refresh(),this.process()}function e(o){return this.each(function(){var t=s(this),e=t.data("bs.scrollspy"),i="object"==typeof o&&o;e||t.data("bs.scrollspy",e=new n(this,i)),"string"==typeof o&&e[o]()})}n.VERSION="3.4.1",n.DEFAULTS={offset:10},n.prototype.getScrollHeight=function(){return this.$scrollElement[0].scrollHeight||Math.max(this.$body[0].scrollHeight,document.documentElement.scrollHeight)},n.prototype.refresh=function(){var t=this,o="offset",n=0;this.offsets=[],this.targets=[],this.scrollHeight=this.getScrollHeight(),s.isWindow(this.$scrollElement[0])||(o="position",n=this.$scrollElement.scrollTop()),this.$body.find(this.selector).map(function(){var t=s(this),e=t.data("target")||t.attr("href"),i=/^#./.test(e)&&s(e);return i&&i.length&&i.is(":visible")&&[[i[o]().top+n,e]]||null}).sort(function(t,e){return t[0]-e[0]}).each(function(){t.offsets.push(this[0]),t.targets.push(this[1])})},n.prototype.process=function(){var t,e=this.$scrollElement.scrollTop()+this.options.offset,i=this.getScrollHeight(),o=this.options.offset+i-this.$scrollElement.height(),n=this.offsets,s=this.targets,a=this.activeTarget;if(this.scrollHeight!=i&&this.refresh(),o<=e)return a!=(t=s[s.length-1])&&this.activate(t);if(a&&e<n[0])return this.activeTarget=null,this.clear();for(t=n.length;t--;)a!=s[t]&&e>=n[t]&&(n[t+1]===undefined||e<n[t+1])&&this.activate(s[t])},n.prototype.activate=function(t){this.activeTarget=t,this.clear();var e=this.selector+'[data-target="'+t+'"],'+this.selector+'[href="'+t+'"]',i=s(e).parents("li").addClass("active");i.parent(".dropdown-menu").length&&(i=i.closest("li.dropdown").addClass("active")),i.trigger("activate.bs.scrollspy")},n.prototype.clear=function(){s(this.selector).parentsUntil(this.options.target,".active").removeClass("active")};var t=s.fn.scrollspy;s.fn.scrollspy=e,s.fn.scrollspy.Constructor=n,s.fn.scrollspy.noConflict=function(){return s.fn.scrollspy=t,this},s(window).on("load.bs.scrollspy.data-api",function(){s('[data-spy="scroll"]').each(function(){var t=s(this);e.call(t,t.data())})})}(jQuery),function(r){"use strict";var a=function(t){this.element=r(t)};function e(i){return this.each(function(){var t=r(this),e=t.data("bs.tab");e||t.data("bs.tab",e=new a(this)),"string"==typeof i&&e[i]()})}a.VERSION="3.4.1",a.TRANSITION_DURATION=150,a.prototype.show=function(){var t=this.element,e=t.closest("ul:not(.dropdown-menu)"),i=t.data("target");if(i||(i=(i=t.attr("href"))&&i.replace(/.*(?=#[^\s]*$)/,"")),!t.parent("li").hasClass("active")){var o=e.find(".active:last a"),n=r.Event("hide.bs.tab",{relatedTarget:t[0]}),s=r.Event("show.bs.tab",{relatedTarget:o[0]});if(o.trigger(n),t.trigger(s),!s.isDefaultPrevented()&&!n.isDefaultPrevented()){var a=r(document).find(i);this.activate(t.closest("li"),e),this.activate(a,a.parent(),function(){o.trigger({type:"hidden.bs.tab",relatedTarget:t[0]}),t.trigger({type:"shown.bs.tab",relatedTarget:o[0]})})}}},a.prototype.activate=function(t,e,i){var o=e.find("> .active"),n=i&&r.support.transition&&(o.length&&o.hasClass("fade")||!!e.find("> .fade").length);function s(){o.removeClass("active").find("> .dropdown-menu > .active").removeClass("active").end().find('[data-toggle="tab"]').attr("aria-expanded",!1),t.addClass("active").find('[data-toggle="tab"]').attr("aria-expanded",!0),n?(t[0].offsetWidth,t.addClass("in")):t.removeClass("fade"),t.parent(".dropdown-menu").length&&t.closest("li.dropdown").addClass("active").end().find('[data-toggle="tab"]').attr("aria-expanded",!0),i&&i()}o.length&&n?o.one("bsTransitionEnd",s).emulateTransitionEnd(a.TRANSITION_DURATION):s(),o.removeClass("in")};var t=r.fn.tab;r.fn.tab=e,r.fn.tab.Constructor=a,r.fn.tab.noConflict=function(){return r.fn.tab=t,this};var i=function(t){t.preventDefault(),e.call(r(this),"show")};r(document).on("click.bs.tab.data-api",'[data-toggle="tab"]',i).on("click.bs.tab.data-api",'[data-toggle="pill"]',i)}(jQuery),function(l){"use strict";var h=function(t,e){this.options=l.extend({},h.DEFAULTS,e);var i=this.options.target===h.DEFAULTS.target?l(this.options.target):l(document).find(this.options.target);this.$target=i.on("scroll.bs.affix.data-api",l.proxy(this.checkPosition,this)).on("click.bs.affix.data-api",l.proxy(this.checkPositionWithEventLoop,this)),this.$element=l(t),this.affixed=null,this.unpin=null,this.pinnedOffset=null,this.checkPosition()};function i(o){return this.each(function(){var t=l(this),e=t.data("bs.affix"),i="object"==typeof o&&o;e||t.data("bs.affix",e=new h(this,i)),"string"==typeof o&&e[o]()})}h.VERSION="3.4.1",h.RESET="affix affix-top affix-bottom",h.DEFAULTS={offset:0,target:window},h.prototype.getState=function(t,e,i,o){var n=this.$target.scrollTop(),s=this.$element.offset(),a=this.$target.height();if(null!=i&&"top"==this.affixed)return n<i&&"top";if("bottom"==this.affixed)return null!=i?!(n+this.unpin<=s.top)&&"bottom":!(n+a<=t-o)&&"bottom";var r=null==this.affixed,l=r?n:s.top;return null!=i&&n<=i?"top":null!=o&&t-o<=l+(r?a:e)&&"bottom"},h.prototype.getPinnedOffset=function(){if(this.pinnedOffset)return this.pinnedOffset;this.$element.removeClass(h.RESET).addClass("affix");var t=this.$target.scrollTop(),e=this.$element.offset();return this.pinnedOffset=e.top-t},h.prototype.checkPositionWithEventLoop=function(){setTimeout(l.proxy(this.checkPosition,this),1)},h.prototype.checkPosition=function(){if(this.$element.is(":visible")){var t=this.$element.height(),e=this.options.offset,i=e.top,o=e.bottom,n=Math.max(l(document).height(),l(document.body).height());"object"!=typeof e&&(o=i=e),"function"==typeof i&&(i=e.top(this.$element)),"function"==typeof o&&(o=e.bottom(this.$element));var s=this.getState(n,t,i,o);if(this.affixed!=s){null!=this.unpin&&this.$element.css("top","");var a="affix"+(s?"-"+s:""),r=l.Event(a+".bs.affix");if(this.$element.trigger(r),r.isDefaultPrevented())return;this.affixed=s,this.unpin="bottom"==s?this.getPinnedOffset():null,this.$element.removeClass(h.RESET).addClass(a).trigger(a.replace("affix","affixed")+".bs.affix")}"bottom"==s&&this.$element.offset({top:n-t-o})}};var t=l.fn.affix;l.fn.affix=i,l.fn.affix.Constructor=h,l.fn.affix.noConflict=function(){return l.fn.affix=t,this},l(window).on("load",function(){l('[data-spy="affix"]').each(function(){var t=l(this),e=t.data();e.offset=e.offset||{},null!=e.offsetBottom&&(e.offset.bottom=e.offsetBottom),null!=e.offsetTop&&(e.offset.top=e.offsetTop),i.call(t,e)})})}(jQuery);
/**
 * Owl Carousel v2.2.1
 * Copyright 2013-2017 David Deutsch
 * Licensed under  ()
 */
!function(a,b,c,d){function e(b,c){this.settings=null,this.options=a.extend({},e.Defaults,c),this.$element=a(b),this._handlers={},this._plugins={},this._supress={},this._current=null,this._speed=null,this._coordinates=[],this._breakpoint=null,this._width=null,this._items=[],this._clones=[],this._mergers=[],this._widths=[],this._invalidated={},this._pipe=[],this._drag={time:null,target:null,pointer:null,stage:{start:null,current:null},direction:null},this._states={current:{},tags:{initializing:["busy"],animating:["busy"],dragging:["interacting"]}},a.each(["onResize","onThrottledResize"],a.proxy(function(b,c){this._handlers[c]=a.proxy(this[c],this)},this)),a.each(e.Plugins,a.proxy(function(a,b){this._plugins[a.charAt(0).toLowerCase()+a.slice(1)]=new b(this)},this)),a.each(e.Workers,a.proxy(function(b,c){this._pipe.push({filter:c.filter,run:a.proxy(c.run,this)})},this)),this.setup(),this.initialize()}e.Defaults={items:3,loop:!1,center:!1,rewind:!1,mouseDrag:!0,touchDrag:!0,pullDrag:!0,freeDrag:!1,margin:0,stagePadding:0,merge:!1,mergeFit:!0,autoWidth:!1,startPosition:0,rtl:!1,smartSpeed:250,fluidSpeed:!1,dragEndSpeed:!1,responsive:{},responsiveRefreshRate:200,responsiveBaseElement:b,fallbackEasing:"swing",info:!1,nestedItemSelector:!1,itemElement:"div",stageElement:"div",refreshClass:"owl-refresh",loadedClass:"owl-loaded",loadingClass:"owl-loading",rtlClass:"owl-rtl",responsiveClass:"owl-responsive",dragClass:"owl-drag",itemClass:"owl-item",stageClass:"owl-stage",stageOuterClass:"owl-stage-outer",grabClass:"owl-grab"},e.Width={Default:"default",Inner:"inner",Outer:"outer"},e.Type={Event:"event",State:"state"},e.Plugins={},e.Workers=[{filter:["width","settings"],run:function(){this._width=this.$element.width()}},{filter:["width","items","settings"],run:function(a){a.current=this._items&&this._items[this.relative(this._current)]}},{filter:["items","settings"],run:function(){this.$stage.children(".cloned").remove()}},{filter:["width","items","settings"],run:function(a){var b=this.settings.margin||"",c=!this.settings.autoWidth,d=this.settings.rtl,e={width:"auto","margin-left":d?b:"","margin-right":d?"":b};!c&&this.$stage.children().css(e),a.css=e}},{filter:["width","items","settings"],run:function(a){var b=(this.width()/this.settings.items).toFixed(3)-this.settings.margin,c=null,d=this._items.length,e=!this.settings.autoWidth,f=[];for(a.items={merge:!1,width:b};d--;)c=this._mergers[d],c=this.settings.mergeFit&&Math.min(c,this.settings.items)||c,a.items.merge=c>1||a.items.merge,f[d]=e?b*c:this._items[d].width();this._widths=f}},{filter:["items","settings"],run:function(){var b=[],c=this._items,d=this.settings,e=Math.max(2*d.items,4),f=2*Math.ceil(c.length/2),g=d.loop&&c.length?d.rewind?e:Math.max(e,f):0,h="",i="";for(g/=2;g--;)b.push(this.normalize(b.length/2,!0)),h+=c[b[b.length-1]][0].outerHTML,b.push(this.normalize(c.length-1-(b.length-1)/2,!0)),i=c[b[b.length-1]][0].outerHTML+i;this._clones=b,a(h).addClass("cloned").appendTo(this.$stage),a(i).addClass("cloned").prependTo(this.$stage)}},{filter:["width","items","settings"],run:function(){for(var a=this.settings.rtl?1:-1,b=this._clones.length+this._items.length,c=-1,d=0,e=0,f=[];++c<b;)d=f[c-1]||0,e=this._widths[this.relative(c)]+this.settings.margin,f.push(d+e*a);this._coordinates=f}},{filter:["width","items","settings"],run:function(){var a=this.settings.stagePadding,b=this._coordinates,c={width:Math.ceil(Math.abs(b[b.length-1]))+2*a,"padding-left":a||"","padding-right":a||""};this.$stage.css(c)}},{filter:["width","items","settings"],run:function(a){var b=this._coordinates.length,c=!this.settings.autoWidth,d=this.$stage.children();if(c&&a.items.merge)for(;b--;)a.css.width=this._widths[this.relative(b)],d.eq(b).css(a.css);else c&&(a.css.width=a.items.width,d.css(a.css))}},{filter:["items"],run:function(){this._coordinates.length<1&&this.$stage.removeAttr("style")}},{filter:["width","items","settings"],run:function(a){a.current=a.current?this.$stage.children().index(a.current):0,a.current=Math.max(this.minimum(),Math.min(this.maximum(),a.current)),this.reset(a.current)}},{filter:["position"],run:function(){this.animate(this.coordinates(this._current))}},{filter:["width","position","items","settings"],run:function(){var a,b,c,d,e=this.settings.rtl?1:-1,f=2*this.settings.stagePadding,g=this.coordinates(this.current())+f,h=g+this.width()*e,i=[];for(c=0,d=this._coordinates.length;c<d;c++)a=this._coordinates[c-1]||0,b=Math.abs(this._coordinates[c])+f*e,(this.op(a,"<=",g)&&this.op(a,">",h)||this.op(b,"<",g)&&this.op(b,">",h))&&i.push(c);this.$stage.children(".active").removeClass("active"),this.$stage.children(":eq("+i.join("), :eq(")+")").addClass("active"),this.settings.center&&(this.$stage.children(".center").removeClass("center"),this.$stage.children().eq(this.current()).addClass("center"))}}],e.prototype.initialize=function(){if(this.enter("initializing"),this.trigger("initialize"),this.$element.toggleClass(this.settings.rtlClass,this.settings.rtl),this.settings.autoWidth&&!this.is("pre-loading")){var b,c,e;b=this.$element.find("img"),c=this.settings.nestedItemSelector?"."+this.settings.nestedItemSelector:d,e=this.$element.children(c).width(),b.length&&e<=0&&this.preloadAutoWidthImages(b)}this.$element.addClass(this.options.loadingClass),this.$stage=a("<"+this.settings.stageElement+' class="'+this.settings.stageClass+'"/>').wrap('<div class="'+this.settings.stageOuterClass+'"/>'),this.$element.append(this.$stage.parent()),this.replace(this.$element.children().not(this.$stage.parent())),this.$element.is(":visible")?this.refresh():this.invalidate("width"),this.$element.removeClass(this.options.loadingClass).addClass(this.options.loadedClass),this.registerEventHandlers(),this.leave("initializing"),this.trigger("initialized")},e.prototype.setup=function(){var b=this.viewport(),c=this.options.responsive,d=-1,e=null;c?(a.each(c,function(a){a<=b&&a>d&&(d=Number(a))}),e=a.extend({},this.options,c[d]),"function"==typeof e.stagePadding&&(e.stagePadding=e.stagePadding()),delete e.responsive,e.responsiveClass&&this.$element.attr("class",this.$element.attr("class").replace(new RegExp("("+this.options.responsiveClass+"-)\\S+\\s","g"),"$1"+d))):e=a.extend({},this.options),this.trigger("change",{property:{name:"settings",value:e}}),this._breakpoint=d,this.settings=e,this.invalidate("settings"),this.trigger("changed",{property:{name:"settings",value:this.settings}})},e.prototype.optionsLogic=function(){this.settings.autoWidth&&(this.settings.stagePadding=!1,this.settings.merge=!1)},e.prototype.prepare=function(b){var c=this.trigger("prepare",{content:b});return c.data||(c.data=a("<"+this.settings.itemElement+"/>").addClass(this.options.itemClass).append(b)),this.trigger("prepared",{content:c.data}),c.data},e.prototype.update=function(){for(var b=0,c=this._pipe.length,d=a.proxy(function(a){return this[a]},this._invalidated),e={};b<c;)(this._invalidated.all||a.grep(this._pipe[b].filter,d).length>0)&&this._pipe[b].run(e),b++;this._invalidated={},!this.is("valid")&&this.enter("valid")},e.prototype.width=function(a){switch(a=a||e.Width.Default){case e.Width.Inner:case e.Width.Outer:return this._width;default:return this._width-2*this.settings.stagePadding+this.settings.margin}},e.prototype.refresh=function(){this.enter("refreshing"),this.trigger("refresh"),this.setup(),this.optionsLogic(),this.$element.addClass(this.options.refreshClass),this.update(),this.$element.removeClass(this.options.refreshClass),this.leave("refreshing"),this.trigger("refreshed")},e.prototype.onThrottledResize=function(){b.clearTimeout(this.resizeTimer),this.resizeTimer=b.setTimeout(this._handlers.onResize,this.settings.responsiveRefreshRate)},e.prototype.onResize=function(){return!!this._items.length&&(this._width!==this.$element.width()&&(!!this.$element.is(":visible")&&(this.enter("resizing"),this.trigger("resize").isDefaultPrevented()?(this.leave("resizing"),!1):(this.invalidate("width"),this.refresh(),this.leave("resizing"),void this.trigger("resized")))))},e.prototype.registerEventHandlers=function(){a.support.transition&&this.$stage.on(a.support.transition.end+".owl.core",a.proxy(this.onTransitionEnd,this)),this.settings.responsive!==!1&&this.on(b,"resize",this._handlers.onThrottledResize),this.settings.mouseDrag&&(this.$element.addClass(this.options.dragClass),this.$stage.on("mousedown.owl.core",a.proxy(this.onDragStart,this)),this.$stage.on("dragstart.owl.core selectstart.owl.core",function(){return!1})),this.settings.touchDrag&&(this.$stage.on("touchstart.owl.core",a.proxy(this.onDragStart,this)),this.$stage.on("touchcancel.owl.core",a.proxy(this.onDragEnd,this)))},e.prototype.onDragStart=function(b){var d=null;3!==b.which&&(a.support.transform?(d=this.$stage.css("transform").replace(/.*\(|\)| /g,"").split(","),d={x:d[16===d.length?12:4],y:d[16===d.length?13:5]}):(d=this.$stage.position(),d={x:this.settings.rtl?d.left+this.$stage.width()-this.width()+this.settings.margin:d.left,y:d.top}),this.is("animating")&&(a.support.transform?this.animate(d.x):this.$stage.stop(),this.invalidate("position")),this.$element.toggleClass(this.options.grabClass,"mousedown"===b.type),this.speed(0),this._drag.time=(new Date).getTime(),this._drag.target=a(b.target),this._drag.stage.start=d,this._drag.stage.current=d,this._drag.pointer=this.pointer(b),a(c).on("mouseup.owl.core touchend.owl.core",a.proxy(this.onDragEnd,this)),a(c).one("mousemove.owl.core touchmove.owl.core",a.proxy(function(b){var d=this.difference(this._drag.pointer,this.pointer(b));a(c).on("mousemove.owl.core touchmove.owl.core",a.proxy(this.onDragMove,this)),Math.abs(d.x)<Math.abs(d.y)&&this.is("valid")||(b.preventDefault(),this.enter("dragging"),this.trigger("drag"))},this)))},e.prototype.onDragMove=function(a){var b=null,c=null,d=null,e=this.difference(this._drag.pointer,this.pointer(a)),f=this.difference(this._drag.stage.start,e);this.is("dragging")&&(a.preventDefault(),this.settings.loop?(b=this.coordinates(this.minimum()),c=this.coordinates(this.maximum()+1)-b,f.x=((f.x-b)%c+c)%c+b):(b=this.settings.rtl?this.coordinates(this.maximum()):this.coordinates(this.minimum()),c=this.settings.rtl?this.coordinates(this.minimum()):this.coordinates(this.maximum()),d=this.settings.pullDrag?-1*e.x/5:0,f.x=Math.max(Math.min(f.x,b+d),c+d)),this._drag.stage.current=f,this.animate(f.x))},e.prototype.onDragEnd=function(b){var d=this.difference(this._drag.pointer,this.pointer(b)),e=this._drag.stage.current,f=d.x>0^this.settings.rtl?"left":"right";a(c).off(".owl.core"),this.$element.removeClass(this.options.grabClass),(0!==d.x&&this.is("dragging")||!this.is("valid"))&&(this.speed(this.settings.dragEndSpeed||this.settings.smartSpeed),this.current(this.closest(e.x,0!==d.x?f:this._drag.direction)),this.invalidate("position"),this.update(),this._drag.direction=f,(Math.abs(d.x)>3||(new Date).getTime()-this._drag.time>300)&&this._drag.target.one("click.owl.core",function(){return!1})),this.is("dragging")&&(this.leave("dragging"),this.trigger("dragged"))},e.prototype.closest=function(b,c){var d=-1,e=30,f=this.width(),g=this.coordinates();return this.settings.freeDrag||a.each(g,a.proxy(function(a,h){return"left"===c&&b>h-e&&b<h+e?d=a:"right"===c&&b>h-f-e&&b<h-f+e?d=a+1:this.op(b,"<",h)&&this.op(b,">",g[a+1]||h-f)&&(d="left"===c?a+1:a),d===-1},this)),this.settings.loop||(this.op(b,">",g[this.minimum()])?d=b=this.minimum():this.op(b,"<",g[this.maximum()])&&(d=b=this.maximum())),d},e.prototype.animate=function(b){var c=this.speed()>0;this.is("animating")&&this.onTransitionEnd(),c&&(this.enter("animating"),this.trigger("translate")),a.support.transform3d&&a.support.transition?this.$stage.css({transform:"translate3d("+b+"px,0px,0px)",transition:this.speed()/1e3+"s"}):c?this.$stage.animate({left:b+"px"},this.speed(),this.settings.fallbackEasing,a.proxy(this.onTransitionEnd,this)):this.$stage.css({left:b+"px"})},e.prototype.is=function(a){return this._states.current[a]&&this._states.current[a]>0},e.prototype.current=function(a){if(a===d)return this._current;if(0===this._items.length)return d;if(a=this.normalize(a),this._current!==a){var b=this.trigger("change",{property:{name:"position",value:a}});b.data!==d&&(a=this.normalize(b.data)),this._current=a,this.invalidate("position"),this.trigger("changed",{property:{name:"position",value:this._current}})}return this._current},e.prototype.invalidate=function(b){return"string"===a.type(b)&&(this._invalidated[b]=!0,this.is("valid")&&this.leave("valid")),a.map(this._invalidated,function(a,b){return b})},e.prototype.reset=function(a){a=this.normalize(a),a!==d&&(this._speed=0,this._current=a,this.suppress(["translate","translated"]),this.animate(this.coordinates(a)),this.release(["translate","translated"]))},e.prototype.normalize=function(a,b){var c=this._items.length,e=b?0:this._clones.length;return!this.isNumeric(a)||c<1?a=d:(a<0||a>=c+e)&&(a=((a-e/2)%c+c)%c+e/2),a},e.prototype.relative=function(a){return a-=this._clones.length/2,this.normalize(a,!0)},e.prototype.maximum=function(a){var b,c,d,e=this.settings,f=this._coordinates.length;if(e.loop)f=this._clones.length/2+this._items.length-1;else if(e.autoWidth||e.merge){for(b=this._items.length,c=this._items[--b].width(),d=this.$element.width();b--&&(c+=this._items[b].width()+this.settings.margin,!(c>d)););f=b+1}else f=e.center?this._items.length-1:this._items.length-e.items;return a&&(f-=this._clones.length/2),Math.max(f,0)},e.prototype.minimum=function(a){return a?0:this._clones.length/2},e.prototype.items=function(a){return a===d?this._items.slice():(a=this.normalize(a,!0),this._items[a])},e.prototype.mergers=function(a){return a===d?this._mergers.slice():(a=this.normalize(a,!0),this._mergers[a])},e.prototype.clones=function(b){var c=this._clones.length/2,e=c+this._items.length,f=function(a){return a%2===0?e+a/2:c-(a+1)/2};return b===d?a.map(this._clones,function(a,b){return f(b)}):a.map(this._clones,function(a,c){return a===b?f(c):null})},e.prototype.speed=function(a){return a!==d&&(this._speed=a),this._speed},e.prototype.coordinates=function(b){var c,e=1,f=b-1;return b===d?a.map(this._coordinates,a.proxy(function(a,b){return this.coordinates(b)},this)):(this.settings.center?(this.settings.rtl&&(e=-1,f=b+1),c=this._coordinates[b],c+=(this.width()-c+(this._coordinates[f]||0))/2*e):c=this._coordinates[f]||0,c=Math.ceil(c))},e.prototype.duration=function(a,b,c){return 0===c?0:Math.min(Math.max(Math.abs(b-a),1),6)*Math.abs(c||this.settings.smartSpeed)},e.prototype.to=function(a,b){var c=this.current(),d=null,e=a-this.relative(c),f=(e>0)-(e<0),g=this._items.length,h=this.minimum(),i=this.maximum();this.settings.loop?(!this.settings.rewind&&Math.abs(e)>g/2&&(e+=f*-1*g),a=c+e,d=((a-h)%g+g)%g+h,d!==a&&d-e<=i&&d-e>0&&(c=d-e,a=d,this.reset(c))):this.settings.rewind?(i+=1,a=(a%i+i)%i):a=Math.max(h,Math.min(i,a)),this.speed(this.duration(c,a,b)),this.current(a),this.$element.is(":visible")&&this.update()},e.prototype.next=function(a){a=a||!1,this.to(this.relative(this.current())+1,a)},e.prototype.prev=function(a){a=a||!1,this.to(this.relative(this.current())-1,a)},e.prototype.onTransitionEnd=function(a){if(a!==d&&(a.stopPropagation(),(a.target||a.srcElement||a.originalTarget)!==this.$stage.get(0)))return!1;this.leave("animating"),this.trigger("translated")},e.prototype.viewport=function(){var d;return this.options.responsiveBaseElement!==b?d=a(this.options.responsiveBaseElement).width():b.innerWidth?d=b.innerWidth:c.documentElement&&c.documentElement.clientWidth?d=c.documentElement.clientWidth:console.warn("Can not detect viewport width."),d},e.prototype.replace=function(b){this.$stage.empty(),this._items=[],b&&(b=b instanceof jQuery?b:a(b)),this.settings.nestedItemSelector&&(b=b.find("."+this.settings.nestedItemSelector)),b.filter(function(){return 1===this.nodeType}).each(a.proxy(function(a,b){b=this.prepare(b),this.$stage.append(b),this._items.push(b),this._mergers.push(1*b.find("[data-merge]").addBack("[data-merge]").attr("data-merge")||1)},this)),this.reset(this.isNumeric(this.settings.startPosition)?this.settings.startPosition:0),this.invalidate("items")},e.prototype.add=function(b,c){var e=this.relative(this._current);c=c===d?this._items.length:this.normalize(c,!0),b=b instanceof jQuery?b:a(b),this.trigger("add",{content:b,position:c}),b=this.prepare(b),0===this._items.length||c===this._items.length?(0===this._items.length&&this.$stage.append(b),0!==this._items.length&&this._items[c-1].after(b),this._items.push(b),this._mergers.push(1*b.find("[data-merge]").addBack("[data-merge]").attr("data-merge")||1)):(this._items[c].before(b),this._items.splice(c,0,b),this._mergers.splice(c,0,1*b.find("[data-merge]").addBack("[data-merge]").attr("data-merge")||1)),this._items[e]&&this.reset(this._items[e].index()),this.invalidate("items"),this.trigger("added",{content:b,position:c})},e.prototype.remove=function(a){a=this.normalize(a,!0),a!==d&&(this.trigger("remove",{content:this._items[a],position:a}),this._items[a].remove(),this._items.splice(a,1),this._mergers.splice(a,1),this.invalidate("items"),this.trigger("removed",{content:null,position:a}))},e.prototype.preloadAutoWidthImages=function(b){b.each(a.proxy(function(b,c){this.enter("pre-loading"),c=a(c),a(new Image).one("load",a.proxy(function(a){c.attr("src",a.target.src),c.css("opacity",1),this.leave("pre-loading"),!this.is("pre-loading")&&!this.is("initializing")&&this.refresh()},this)).attr("src",c.attr("src")||c.attr("data-src")||c.attr("data-src-retina"))},this))},e.prototype.destroy=function(){this.$element.off(".owl.core"),this.$stage.off(".owl.core"),a(c).off(".owl.core"),this.settings.responsive!==!1&&(b.clearTimeout(this.resizeTimer),this.off(b,"resize",this._handlers.onThrottledResize));for(var d in this._plugins)this._plugins[d].destroy();this.$stage.children(".cloned").remove(),this.$stage.unwrap(),this.$stage.children().contents().unwrap(),this.$stage.children().unwrap(),this.$element.removeClass(this.options.refreshClass).removeClass(this.options.loadingClass).removeClass(this.options.loadedClass).removeClass(this.options.rtlClass).removeClass(this.options.dragClass).removeClass(this.options.grabClass).attr("class",this.$element.attr("class").replace(new RegExp(this.options.responsiveClass+"-\\S+\\s","g"),"")).removeData("owl.carousel")},e.prototype.op=function(a,b,c){var d=this.settings.rtl;switch(b){case"<":return d?a>c:a<c;case">":return d?a<c:a>c;case">=":return d?a<=c:a>=c;case"<=":return d?a>=c:a<=c}},e.prototype.on=function(a,b,c,d){a.addEventListener?a.addEventListener(b,c,d):a.attachEvent&&a.attachEvent("on"+b,c)},e.prototype.off=function(a,b,c,d){a.removeEventListener?a.removeEventListener(b,c,d):a.detachEvent&&a.detachEvent("on"+b,c)},e.prototype.trigger=function(b,c,d,f,g){var h={item:{count:this._items.length,index:this.current()}},i=a.camelCase(a.grep(["on",b,d],function(a){return a}).join("-").toLowerCase()),j=a.Event([b,"owl",d||"carousel"].join(".").toLowerCase(),a.extend({relatedTarget:this},h,c));return this._supress[b]||(a.each(this._plugins,function(a,b){b.onTrigger&&b.onTrigger(j)}),this.register({type:e.Type.Event,name:b}),this.$element.trigger(j),this.settings&&"function"==typeof this.settings[i]&&this.settings[i].call(this,j)),j},e.prototype.enter=function(b){a.each([b].concat(this._states.tags[b]||[]),a.proxy(function(a,b){this._states.current[b]===d&&(this._states.current[b]=0),this._states.current[b]++},this))},e.prototype.leave=function(b){a.each([b].concat(this._states.tags[b]||[]),a.proxy(function(a,b){this._states.current[b]--},this))},e.prototype.register=function(b){if(b.type===e.Type.Event){if(a.event.special[b.name]||(a.event.special[b.name]={}),!a.event.special[b.name].owl){var c=a.event.special[b.name]._default;a.event.special[b.name]._default=function(a){return!c||!c.apply||a.namespace&&a.namespace.indexOf("owl")!==-1?a.namespace&&a.namespace.indexOf("owl")>-1:c.apply(this,arguments)},a.event.special[b.name].owl=!0}}else b.type===e.Type.State&&(this._states.tags[b.name]?this._states.tags[b.name]=this._states.tags[b.name].concat(b.tags):this._states.tags[b.name]=b.tags,this._states.tags[b.name]=a.grep(this._states.tags[b.name],a.proxy(function(c,d){return a.inArray(c,this._states.tags[b.name])===d},this)))},e.prototype.suppress=function(b){a.each(b,a.proxy(function(a,b){this._supress[b]=!0},this))},e.prototype.release=function(b){a.each(b,a.proxy(function(a,b){delete this._supress[b]},this))},e.prototype.pointer=function(a){var c={x:null,y:null};return a=a.originalEvent||a||b.event,a=a.touches&&a.touches.length?a.touches[0]:a.changedTouches&&a.changedTouches.length?a.changedTouches[0]:a,a.pageX?(c.x=a.pageX,c.y=a.pageY):(c.x=a.clientX,c.y=a.clientY),c},e.prototype.isNumeric=function(a){return!isNaN(parseFloat(a))},e.prototype.difference=function(a,b){return{x:a.x-b.x,y:a.y-b.y}},a.fn.owlCarousel=function(b){var c=Array.prototype.slice.call(arguments,1);return this.each(function(){var d=a(this),f=d.data("owl.carousel");f||(f=new e(this,"object"==typeof b&&b),d.data("owl.carousel",f),a.each(["next","prev","to","destroy","refresh","replace","add","remove"],function(b,c){f.register({type:e.Type.Event,name:c}),f.$element.on(c+".owl.carousel.core",a.proxy(function(a){a.namespace&&a.relatedTarget!==this&&(this.suppress([c]),f[c].apply(this,[].slice.call(arguments,1)),this.release([c]))},f))})),"string"==typeof b&&"_"!==b.charAt(0)&&f[b].apply(f,c)})},a.fn.owlCarousel.Constructor=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._interval=null,this._visible=null,this._handlers={"initialized.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.autoRefresh&&this.watch()},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this._core.$element.on(this._handlers)};e.Defaults={autoRefresh:!0,autoRefreshInterval:500},e.prototype.watch=function(){this._interval||(this._visible=this._core.$element.is(":visible"),this._interval=b.setInterval(a.proxy(this.refresh,this),this._core.settings.autoRefreshInterval))},e.prototype.refresh=function(){this._core.$element.is(":visible")!==this._visible&&(this._visible=!this._visible,this._core.$element.toggleClass("owl-hidden",!this._visible),this._visible&&this._core.invalidate("width")&&this._core.refresh())},e.prototype.destroy=function(){var a,c;b.clearInterval(this._interval);for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(c in Object.getOwnPropertyNames(this))"function"!=typeof this[c]&&(this[c]=null)},a.fn.owlCarousel.Constructor.Plugins.AutoRefresh=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._loaded=[],this._handlers={"initialized.owl.carousel change.owl.carousel resized.owl.carousel":a.proxy(function(b){if(b.namespace&&this._core.settings&&this._core.settings.lazyLoad&&(b.property&&"position"==b.property.name||"initialized"==b.type))for(var c=this._core.settings,e=c.center&&Math.ceil(c.items/2)||c.items,f=c.center&&e*-1||0,g=(b.property&&b.property.value!==d?b.property.value:this._core.current())+f,h=this._core.clones().length,i=a.proxy(function(a,b){this.load(b)},this);f++<e;)this.load(h/2+this._core.relative(g)),h&&a.each(this._core.clones(this._core.relative(g)),i),g++},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this._core.$element.on(this._handlers)};e.Defaults={lazyLoad:!1},e.prototype.load=function(c){var d=this._core.$stage.children().eq(c),e=d&&d.find(".owl-lazy");!e||a.inArray(d.get(0),this._loaded)>-1||(e.each(a.proxy(function(c,d){var e,f=a(d),g=b.devicePixelRatio>1&&f.attr("data-src-retina")||f.attr("data-src");this._core.trigger("load",{element:f,url:g},"lazy"),f.is("img")?f.one("load.owl.lazy",a.proxy(function(){f.css("opacity",1),this._core.trigger("loaded",{element:f,url:g},"lazy")},this)).attr("src",g):(e=new Image,e.onload=a.proxy(function(){f.css({"background-image":'url("'+g+'")',opacity:"1"}),this._core.trigger("loaded",{element:f,url:g},"lazy")},this),e.src=g)},this)),this._loaded.push(d.get(0)))},e.prototype.destroy=function(){var a,b;for(a in this.handlers)this._core.$element.off(a,this.handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.Lazy=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._handlers={"initialized.owl.carousel refreshed.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.autoHeight&&this.update()},this),"changed.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.autoHeight&&"position"==a.property.name&&this.update()},this),"loaded.owl.lazy":a.proxy(function(a){a.namespace&&this._core.settings.autoHeight&&a.element.closest("."+this._core.settings.itemClass).index()===this._core.current()&&this.update()},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this._core.$element.on(this._handlers)};e.Defaults={autoHeight:!1,autoHeightClass:"owl-height"},e.prototype.update=function(){var b=this._core._current,c=b+this._core.settings.items,d=this._core.$stage.children().toArray().slice(b,c),e=[],f=0;a.each(d,function(b,c){e.push(a(c).height())}),f=Math.max.apply(null,e),this._core.$stage.parent().height(f).addClass(this._core.settings.autoHeightClass)},e.prototype.destroy=function(){var a,b;for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.AutoHeight=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._videos={},this._playing=null,this._handlers={"initialized.owl.carousel":a.proxy(function(a){a.namespace&&this._core.register({type:"state",name:"playing",tags:["interacting"]})},this),"resize.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.video&&this.isInFullScreen()&&a.preventDefault()},this),"refreshed.owl.carousel":a.proxy(function(a){a.namespace&&this._core.is("resizing")&&this._core.$stage.find(".cloned .owl-video-frame").remove()},this),"changed.owl.carousel":a.proxy(function(a){a.namespace&&"position"===a.property.name&&this._playing&&this.stop()},this),"prepared.owl.carousel":a.proxy(function(b){if(b.namespace){var c=a(b.content).find(".owl-video");c.length&&(c.css("display","none"),this.fetch(c,a(b.content)))}},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this._core.$element.on(this._handlers),this._core.$element.on("click.owl.video",".owl-video-play-icon",a.proxy(function(a){this.play(a)},this))};e.Defaults={video:!1,videoHeight:!1,videoWidth:!1},e.prototype.fetch=function(a,b){var c=function(){return a.attr("data-vimeo-id")?"vimeo":a.attr("data-vzaar-id")?"vzaar":"youtube"}(),d=a.attr("data-vimeo-id")||a.attr("data-youtube-id")||a.attr("data-vzaar-id"),e=a.attr("data-width")||this._core.settings.videoWidth,f=a.attr("data-height")||this._core.settings.videoHeight,g=a.attr("href");if(!g)throw new Error("Missing video URL.");if(d=g.match(/(http:|https:|)\/\/(player.|www.|app.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com)|vzaar\.com)\/(video\/|videos\/|embed\/|channels\/.+\/|groups\/.+\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/),d[3].indexOf("youtu")>-1)c="youtube";else if(d[3].indexOf("vimeo")>-1)c="vimeo";else{if(!(d[3].indexOf("vzaar")>-1))throw new Error("Video URL not supported.");c="vzaar"}d=d[6],this._videos[g]={type:c,id:d,width:e,height:f},b.attr("data-video",g),this.thumbnail(a,this._videos[g])},e.prototype.thumbnail=function(b,c){var d,e,f,g=c.width&&c.height?'style="width:'+c.width+"px;height:"+c.height+'px;"':"",h=b.find("img"),i="src",j="",k=this._core.settings,l=function(a){e='<div class="owl-video-play-icon"></div>',d=k.lazyLoad?'<div class="owl-video-tn '+j+'" '+i+'="'+a+'"></div>':'<div class="owl-video-tn" style="opacity:1;background-image:url('+a+')"></div>',b.after(d),b.after(e)};if(b.wrap('<div class="owl-video-wrapper"'+g+"></div>"),this._core.settings.lazyLoad&&(i="data-src",j="owl-lazy"),h.length)return l(h.attr(i)),h.remove(),!1;"youtube"===c.type?(f="//img.youtube.com/vi/"+c.id+"/hqdefault.jpg",l(f)):"vimeo"===c.type?a.ajax({type:"GET",url:"//vimeo.com/api/v2/video/"+c.id+".json",jsonp:"callback",dataType:"jsonp",success:function(a){f=a[0].thumbnail_large,l(f)}}):"vzaar"===c.type&&a.ajax({type:"GET",url:"//vzaar.com/api/videos/"+c.id+".json",jsonp:"callback",dataType:"jsonp",success:function(a){f=a.framegrab_url,l(f)}})},e.prototype.stop=function(){this._core.trigger("stop",null,"video"),this._playing.find(".owl-video-frame").remove(),this._playing.removeClass("owl-video-playing"),this._playing=null,this._core.leave("playing"),this._core.trigger("stopped",null,"video")},e.prototype.play=function(b){var c,d=a(b.target),e=d.closest("."+this._core.settings.itemClass),f=this._videos[e.attr("data-video")],g=f.width||"100%",h=f.height||this._core.$stage.height();this._playing||(this._core.enter("playing"),this._core.trigger("play",null,"video"),e=this._core.items(this._core.relative(e.index())),this._core.reset(e.index()),"youtube"===f.type?c='<iframe width="'+g+'" height="'+h+'" src="//www.youtube.com/embed/'+f.id+"?autoplay=1&rel=0&v="+f.id+'" frameborder="0" allowfullscreen></iframe>':"vimeo"===f.type?c='<iframe src="//player.vimeo.com/video/'+f.id+'?autoplay=1" width="'+g+'" height="'+h+'" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>':"vzaar"===f.type&&(c='<iframe frameborder="0"height="'+h+'"width="'+g+'" allowfullscreen mozallowfullscreen webkitAllowFullScreen src="//view.vzaar.com/'+f.id+'/player?autoplay=true"></iframe>'),a('<div class="owl-video-frame">'+c+"</div>").insertAfter(e.find(".owl-video")),this._playing=e.addClass("owl-video-playing"))},e.prototype.isInFullScreen=function(){var b=c.fullscreenElement||c.mozFullScreenElement||c.webkitFullscreenElement;return b&&a(b).parent().hasClass("owl-video-frame")},e.prototype.destroy=function(){var a,b;this._core.$element.off("click.owl.video");for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.Video=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this.core=b,this.core.options=a.extend({},e.Defaults,this.core.options),this.swapping=!0,this.previous=d,this.next=d,this.handlers={"change.owl.carousel":a.proxy(function(a){a.namespace&&"position"==a.property.name&&(this.previous=this.core.current(),this.next=a.property.value)},this),"drag.owl.carousel dragged.owl.carousel translated.owl.carousel":a.proxy(function(a){a.namespace&&(this.swapping="translated"==a.type)},this),"translate.owl.carousel":a.proxy(function(a){a.namespace&&this.swapping&&(this.core.options.animateOut||this.core.options.animateIn)&&this.swap()},this)},this.core.$element.on(this.handlers)};e.Defaults={animateOut:!1,animateIn:!1},e.prototype.swap=function(){if(1===this.core.settings.items&&a.support.animation&&a.support.transition){this.core.speed(0);var b,c=a.proxy(this.clear,this),d=this.core.$stage.children().eq(this.previous),e=this.core.$stage.children().eq(this.next),f=this.core.settings.animateIn,g=this.core.settings.animateOut;this.core.current()!==this.previous&&(g&&(b=this.core.coordinates(this.previous)-this.core.coordinates(this.next),d.one(a.support.animation.end,c).css({left:b+"px"}).addClass("animated owl-animated-out").addClass(g)),f&&e.one(a.support.animation.end,c).addClass("animated owl-animated-in").addClass(f))}},e.prototype.clear=function(b){a(b.target).css({left:""}).removeClass("animated owl-animated-out owl-animated-in").removeClass(this.core.settings.animateIn).removeClass(this.core.settings.animateOut),this.core.onTransitionEnd()},e.prototype.destroy=function(){var a,b;for(a in this.handlers)this.core.$element.off(a,this.handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},
a.fn.owlCarousel.Constructor.Plugins.Animate=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._timeout=null,this._paused=!1,this._handlers={"changed.owl.carousel":a.proxy(function(a){a.namespace&&"settings"===a.property.name?this._core.settings.autoplay?this.play():this.stop():a.namespace&&"position"===a.property.name&&this._core.settings.autoplay&&this._setAutoPlayInterval()},this),"initialized.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.autoplay&&this.play()},this),"play.owl.autoplay":a.proxy(function(a,b,c){a.namespace&&this.play(b,c)},this),"stop.owl.autoplay":a.proxy(function(a){a.namespace&&this.stop()},this),"mouseover.owl.autoplay":a.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.pause()},this),"mouseleave.owl.autoplay":a.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.play()},this),"touchstart.owl.core":a.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.pause()},this),"touchend.owl.core":a.proxy(function(){this._core.settings.autoplayHoverPause&&this.play()},this)},this._core.$element.on(this._handlers),this._core.options=a.extend({},e.Defaults,this._core.options)};e.Defaults={autoplay:!1,autoplayTimeout:5e3,autoplayHoverPause:!1,autoplaySpeed:!1},e.prototype.play=function(a,b){this._paused=!1,this._core.is("rotating")||(this._core.enter("rotating"),this._setAutoPlayInterval())},e.prototype._getNextTimeout=function(d,e){return this._timeout&&b.clearTimeout(this._timeout),b.setTimeout(a.proxy(function(){this._paused||this._core.is("busy")||this._core.is("interacting")||c.hidden||this._core.next(e||this._core.settings.autoplaySpeed)},this),d||this._core.settings.autoplayTimeout)},e.prototype._setAutoPlayInterval=function(){this._timeout=this._getNextTimeout()},e.prototype.stop=function(){this._core.is("rotating")&&(b.clearTimeout(this._timeout),this._core.leave("rotating"))},e.prototype.pause=function(){this._core.is("rotating")&&(this._paused=!0)},e.prototype.destroy=function(){var a,b;this.stop();for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.autoplay=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){"use strict";var e=function(b){this._core=b,this._initialized=!1,this._pages=[],this._controls={},this._templates=[],this.$element=this._core.$element,this._overrides={next:this._core.next,prev:this._core.prev,to:this._core.to},this._handlers={"prepared.owl.carousel":a.proxy(function(b){b.namespace&&this._core.settings.dotsData&&this._templates.push('<div class="'+this._core.settings.dotClass+'">'+a(b.content).find("[data-dot]").addBack("[data-dot]").attr("data-dot")+"</div>")},this),"added.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.dotsData&&this._templates.splice(a.position,0,this._templates.pop())},this),"remove.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.dotsData&&this._templates.splice(a.position,1)},this),"changed.owl.carousel":a.proxy(function(a){a.namespace&&"position"==a.property.name&&this.draw()},this),"initialized.owl.carousel":a.proxy(function(a){a.namespace&&!this._initialized&&(this._core.trigger("initialize",null,"navigation"),this.initialize(),this.update(),this.draw(),this._initialized=!0,this._core.trigger("initialized",null,"navigation"))},this),"refreshed.owl.carousel":a.proxy(function(a){a.namespace&&this._initialized&&(this._core.trigger("refresh",null,"navigation"),this.update(),this.draw(),this._core.trigger("refreshed",null,"navigation"))},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this.$element.on(this._handlers)};e.Defaults={nav:!1,navText:["prev","next"],navSpeed:!1,navElement:"div",navContainer:!1,navContainerClass:"owl-nav",navClass:["owl-prev","owl-next"],slideBy:1,dotClass:"owl-dot",dotsClass:"owl-dots",dots:!0,dotsEach:!1,dotsData:!1,dotsSpeed:!1,dotsContainer:!1},e.prototype.initialize=function(){var b,c=this._core.settings;this._controls.$relative=(c.navContainer?a(c.navContainer):a("<div>").addClass(c.navContainerClass).appendTo(this.$element)).addClass("disabled"),this._controls.$previous=a("<"+c.navElement+">").addClass(c.navClass[0]).html(c.navText[0]).prependTo(this._controls.$relative).on("click",a.proxy(function(a){this.prev(c.navSpeed)},this)),this._controls.$next=a("<"+c.navElement+">").addClass(c.navClass[1]).html(c.navText[1]).appendTo(this._controls.$relative).on("click",a.proxy(function(a){this.next(c.navSpeed)},this)),c.dotsData||(this._templates=[a("<div>").addClass(c.dotClass).append(a("<span>")).prop("outerHTML")]),this._controls.$absolute=(c.dotsContainer?a(c.dotsContainer):a("<div>").addClass(c.dotsClass).appendTo(this.$element)).addClass("disabled"),this._controls.$absolute.on("click","div",a.proxy(function(b){var d=a(b.target).parent().is(this._controls.$absolute)?a(b.target).index():a(b.target).parent().index();b.preventDefault(),this.to(d,c.dotsSpeed)},this));for(b in this._overrides)this._core[b]=a.proxy(this[b],this)},e.prototype.destroy=function(){var a,b,c,d;for(a in this._handlers)this.$element.off(a,this._handlers[a]);for(b in this._controls)this._controls[b].remove();for(d in this.overides)this._core[d]=this._overrides[d];for(c in Object.getOwnPropertyNames(this))"function"!=typeof this[c]&&(this[c]=null)},e.prototype.update=function(){var a,b,c,d=this._core.clones().length/2,e=d+this._core.items().length,f=this._core.maximum(!0),g=this._core.settings,h=g.center||g.autoWidth||g.dotsData?1:g.dotsEach||g.items;if("page"!==g.slideBy&&(g.slideBy=Math.min(g.slideBy,g.items)),g.dots||"page"==g.slideBy)for(this._pages=[],a=d,b=0,c=0;a<e;a++){if(b>=h||0===b){if(this._pages.push({start:Math.min(f,a-d),end:a-d+h-1}),Math.min(f,a-d)===f)break;b=0,++c}b+=this._core.mergers(this._core.relative(a))}},e.prototype.draw=function(){var b,c=this._core.settings,d=this._core.items().length<=c.items,e=this._core.relative(this._core.current()),f=c.loop||c.rewind;this._controls.$relative.toggleClass("disabled",!c.nav||d),c.nav&&(this._controls.$previous.toggleClass("disabled",!f&&e<=this._core.minimum(!0)),this._controls.$next.toggleClass("disabled",!f&&e>=this._core.maximum(!0))),this._controls.$absolute.toggleClass("disabled",!c.dots||d),c.dots&&(b=this._pages.length-this._controls.$absolute.children().length,c.dotsData&&0!==b?this._controls.$absolute.html(this._templates.join("")):b>0?this._controls.$absolute.append(new Array(b+1).join(this._templates[0])):b<0&&this._controls.$absolute.children().slice(b).remove(),this._controls.$absolute.find(".active").removeClass("active"),this._controls.$absolute.children().eq(a.inArray(this.current(),this._pages)).addClass("active"))},e.prototype.onTrigger=function(b){var c=this._core.settings;b.page={index:a.inArray(this.current(),this._pages),count:this._pages.length,size:c&&(c.center||c.autoWidth||c.dotsData?1:c.dotsEach||c.items)}},e.prototype.current=function(){var b=this._core.relative(this._core.current());return a.grep(this._pages,a.proxy(function(a,c){return a.start<=b&&a.end>=b},this)).pop()},e.prototype.getPosition=function(b){var c,d,e=this._core.settings;return"page"==e.slideBy?(c=a.inArray(this.current(),this._pages),d=this._pages.length,b?++c:--c,c=this._pages[(c%d+d)%d].start):(c=this._core.relative(this._core.current()),d=this._core.items().length,b?c+=e.slideBy:c-=e.slideBy),c},e.prototype.next=function(b){a.proxy(this._overrides.to,this._core)(this.getPosition(!0),b)},e.prototype.prev=function(b){a.proxy(this._overrides.to,this._core)(this.getPosition(!1),b)},e.prototype.to=function(b,c,d){var e;!d&&this._pages.length?(e=this._pages.length,a.proxy(this._overrides.to,this._core)(this._pages[(b%e+e)%e].start,c)):a.proxy(this._overrides.to,this._core)(b,c)},a.fn.owlCarousel.Constructor.Plugins.Navigation=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){"use strict";var e=function(c){this._core=c,this._hashes={},this.$element=this._core.$element,this._handlers={"initialized.owl.carousel":a.proxy(function(c){c.namespace&&"URLHash"===this._core.settings.startPosition&&a(b).trigger("hashchange.owl.navigation")},this),"prepared.owl.carousel":a.proxy(function(b){if(b.namespace){var c=a(b.content).find("[data-hash]").addBack("[data-hash]").attr("data-hash");if(!c)return;this._hashes[c]=b.content}},this),"changed.owl.carousel":a.proxy(function(c){if(c.namespace&&"position"===c.property.name){var d=this._core.items(this._core.relative(this._core.current())),e=a.map(this._hashes,function(a,b){return a===d?b:null}).join();if(!e||b.location.hash.slice(1)===e)return;b.location.hash=e}},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this.$element.on(this._handlers),a(b).on("hashchange.owl.navigation",a.proxy(function(a){var c=b.location.hash.substring(1),e=this._core.$stage.children(),f=this._hashes[c]&&e.index(this._hashes[c]);f!==d&&f!==this._core.current()&&this._core.to(this._core.relative(f),!1,!0)},this))};e.Defaults={URLhashListener:!1},e.prototype.destroy=function(){var c,d;a(b).off("hashchange.owl.navigation");for(c in this._handlers)this._core.$element.off(c,this._handlers[c]);for(d in Object.getOwnPropertyNames(this))"function"!=typeof this[d]&&(this[d]=null)},a.fn.owlCarousel.Constructor.Plugins.Hash=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){function e(b,c){var e=!1,f=b.charAt(0).toUpperCase()+b.slice(1);return a.each((b+" "+h.join(f+" ")+f).split(" "),function(a,b){if(g[b]!==d)return e=!c||b,!1}),e}function f(a){return e(a,!0)}var g=a("<support>").get(0).style,h="Webkit Moz O ms".split(" "),i={transition:{end:{WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd",transition:"transitionend"}},animation:{end:{WebkitAnimation:"webkitAnimationEnd",MozAnimation:"animationend",OAnimation:"oAnimationEnd",animation:"animationend"}}},j={csstransforms:function(){return!!e("transform")},csstransforms3d:function(){return!!e("perspective")},csstransitions:function(){return!!e("transition")},cssanimations:function(){return!!e("animation")}};j.csstransitions()&&(a.support.transition=new String(f("transition")),a.support.transition.end=i.transition.end[a.support.transition]),j.cssanimations()&&(a.support.animation=new String(f("animation")),a.support.animation.end=i.animation.end[a.support.animation]),j.csstransforms()&&(a.support.transform=new String(f("transform")),a.support.transform3d=j.csstransforms3d())}(window.Zepto||window.jQuery,window,document);
// JavaScript Document
/*! WOW - v0.1.6 - 2014-03-19
* Copyright (c) 2014 Matthieu Aussaguel; Licensed MIT */(function(){var a,b=function(a,b){return function(){return a.apply(b,arguments)}};a=function(){function a(){}return a.prototype.extend=function(a,b){var c,d;for(c in a)d=a[c],null!=d&&(b[c]=d);return b},a.prototype.isMobile=function(a){return/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(a)},a}(),this.WOW=function(){function c(a){null==a&&(a={}),this.scrollCallback=b(this.scrollCallback,this),this.scrollHandler=b(this.scrollHandler,this),this.start=b(this.start,this),this.scrolled=!0,this.config=this.util().extend(a,this.defaults)}return c.prototype.defaults={boxClass:"wow",animateClass:"animated",offset:0,mobile:!0},c.prototype.init=function(){var a;return this.element=window.document.documentElement,"interactive"===(a=document.readyState)||"complete"===a?this.start():document.addEventListener("DOMContentLoaded",this.start)},c.prototype.start=function(){var a,b,c,d;if(this.boxes=this.element.getElementsByClassName(this.config.boxClass),this.boxes.length){if(this.disabled())return this.resetStyle();for(d=this.boxes,b=0,c=d.length;c>b;b++)a=d[b],this.applyStyle(a,!0);return window.addEventListener("scroll",this.scrollHandler,!1),window.addEventListener("resize",this.scrollHandler,!1),this.interval=setInterval(this.scrollCallback,50)}},c.prototype.stop=function(){return window.removeEventListener("scroll",this.scrollHandler,!1),window.removeEventListener("resize",this.scrollHandler,!1),null!=this.interval?clearInterval(this.interval):void 0},c.prototype.show=function(a){return this.applyStyle(a),a.className=""+a.className+" "+this.config.animateClass},c.prototype.applyStyle=function(a,b){var c,d,e;return d=a.getAttribute("data-wow-duration"),c=a.getAttribute("data-wow-delay"),e=a.getAttribute("data-wow-iteration"),a.setAttribute("style",this.customStyle(b,d,c,e))},c.prototype.resetStyle=function(){var a,b,c,d,e;for(d=this.boxes,e=[],b=0,c=d.length;c>b;b++)a=d[b],e.push(a.setAttribute("style","visibility: visible;"));return e},c.prototype.customStyle=function(a,b,c,d){var e;return e=a?"visibility: hidden; -webkit-animation-name: none; -moz-animation-name: none; animation-name: none;":"visibility: visible;",b&&(e+="-webkit-animation-duration: "+b+"; -moz-animation-duration: "+b+"; animation-duration: "+b+";"),c&&(e+="-webkit-animation-delay: "+c+"; -moz-animation-delay: "+c+"; animation-delay: "+c+";"),d&&(e+="-webkit-animation-iteration-count: "+d+"; -moz-animation-iteration-count: "+d+"; animation-iteration-count: "+d+";"),e},c.prototype.scrollHandler=function(){return this.scrolled=!0},c.prototype.scrollCallback=function(){var a;return this.scrolled&&(this.scrolled=!1,this.boxes=function(){var b,c,d,e;for(d=this.boxes,e=[],b=0,c=d.length;c>b;b++)a=d[b],a&&(this.isVisible(a)?this.show(a):e.push(a));return e}.call(this),!this.boxes.length)?this.stop():void 0},c.prototype.offsetTop=function(a){var b;for(b=a.offsetTop;a=a.offsetParent;)b+=a.offsetTop;return b},c.prototype.isVisible=function(a){var b,c,d,e,f;return c=a.getAttribute("data-wow-offset")||this.config.offset,f=window.pageYOffset,e=f+this.element.clientHeight-c,d=this.offsetTop(a),b=d+a.clientHeight,e>=d&&b>=f},c.prototype.util=function(){return this._util||(this._util=new a)},c.prototype.disabled=function(){return!this.config.mobile&&this.util().isMobile(navigator.userAgent)},c}()}).call(this);
/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/
jQuery.easing["jswing"]=jQuery.easing["swing"];jQuery.extend(jQuery.easing,{def:"easeOutQuad",swing:function(a,b,c,d,e){return jQuery.easing[jQuery.easing.def](a,b,c,d,e)},easeInQuad:function(a,b,c,d,e){return d*(b/=e)*b+c},easeOutQuad:function(a,b,c,d,e){return-d*(b/=e)*(b-2)+c},easeInOutQuad:function(a,b,c,d,e){if((b/=e/2)<1)return d/2*b*b+c;return-d/2*(--b*(b-2)-1)+c},easeInCubic:function(a,b,c,d,e){return d*(b/=e)*b*b+c},easeOutCubic:function(a,b,c,d,e){return d*((b=b/e-1)*b*b+1)+c},easeInOutCubic:function(a,b,c,d,e){if((b/=e/2)<1)return d/2*b*b*b+c;return d/2*((b-=2)*b*b+2)+c},easeInQuart:function(a,b,c,d,e){return d*(b/=e)*b*b*b+c},easeOutQuart:function(a,b,c,d,e){return-d*((b=b/e-1)*b*b*b-1)+c},easeInOutQuart:function(a,b,c,d,e){if((b/=e/2)<1)return d/2*b*b*b*b+c;return-d/2*((b-=2)*b*b*b-2)+c},easeInQuint:function(a,b,c,d,e){return d*(b/=e)*b*b*b*b+c},easeOutQuint:function(a,b,c,d,e){return d*((b=b/e-1)*b*b*b*b+1)+c},easeInOutQuint:function(a,b,c,d,e){if((b/=e/2)<1)return d/2*b*b*b*b*b+c;return d/2*((b-=2)*b*b*b*b+2)+c},easeInSine:function(a,b,c,d,e){return-d*Math.cos(b/e*(Math.PI/2))+d+c},easeOutSine:function(a,b,c,d,e){return d*Math.sin(b/e*(Math.PI/2))+c},easeInOutSine:function(a,b,c,d,e){return-d/2*(Math.cos(Math.PI*b/e)-1)+c},easeInExpo:function(a,b,c,d,e){return b==0?c:d*Math.pow(2,10*(b/e-1))+c},easeOutExpo:function(a,b,c,d,e){return b==e?c+d:d*(-Math.pow(2,-10*b/e)+1)+c},easeInOutExpo:function(a,b,c,d,e){if(b==0)return c;if(b==e)return c+d;if((b/=e/2)<1)return d/2*Math.pow(2,10*(b-1))+c;return d/2*(-Math.pow(2,-10*--b)+2)+c},easeInCirc:function(a,b,c,d,e){return-d*(Math.sqrt(1-(b/=e)*b)-1)+c},easeOutCirc:function(a,b,c,d,e){return d*Math.sqrt(1-(b=b/e-1)*b)+c},easeInOutCirc:function(a,b,c,d,e){if((b/=e/2)<1)return-d/2*(Math.sqrt(1-b*b)-1)+c;return d/2*(Math.sqrt(1-(b-=2)*b)+1)+c},easeInElastic:function(a,b,c,d,e){var f=1.70158;var g=0;var h=d;if(b==0)return c;if((b/=e)==1)return c+d;if(!g)g=e*.3;if(h<Math.abs(d)){h=d;var f=g/4}else var f=g/(2*Math.PI)*Math.asin(d/h);return-(h*Math.pow(2,10*(b-=1))*Math.sin((b*e-f)*2*Math.PI/g))+c},easeOutElastic:function(a,b,c,d,e){var f=1.70158;var g=0;var h=d;if(b==0)return c;if((b/=e)==1)return c+d;if(!g)g=e*.3;if(h<Math.abs(d)){h=d;var f=g/4}else var f=g/(2*Math.PI)*Math.asin(d/h);return h*Math.pow(2,-10*b)*Math.sin((b*e-f)*2*Math.PI/g)+d+c},easeInOutElastic:function(a,b,c,d,e){var f=1.70158;var g=0;var h=d;if(b==0)return c;if((b/=e/2)==2)return c+d;if(!g)g=e*.3*1.5;if(h<Math.abs(d)){h=d;var f=g/4}else var f=g/(2*Math.PI)*Math.asin(d/h);if(b<1)return-.5*h*Math.pow(2,10*(b-=1))*Math.sin((b*e-f)*2*Math.PI/g)+c;return h*Math.pow(2,-10*(b-=1))*Math.sin((b*e-f)*2*Math.PI/g)*.5+d+c},easeInBack:function(a,b,c,d,e,f){if(f==undefined)f=1.70158;return d*(b/=e)*b*((f+1)*b-f)+c},easeOutBack:function(a,b,c,d,e,f){if(f==undefined)f=1.70158;return d*((b=b/e-1)*b*((f+1)*b+f)+1)+c},easeInOutBack:function(a,b,c,d,e,f){if(f==undefined)f=1.70158;if((b/=e/2)<1)return d/2*b*b*(((f*=1.525)+1)*b-f)+c;return d/2*((b-=2)*b*(((f*=1.525)+1)*b+f)+2)+c},easeInBounce:function(a,b,c,d,e){return d-jQuery.easing.easeOutBounce(a,e-b,0,d,e)+c},easeOutBounce:function(a,b,c,d,e){if((b/=e)<1/2.75){return d*7.5625*b*b+c}else if(b<2/2.75){return d*(7.5625*(b-=1.5/2.75)*b+.75)+c}else if(b<2.5/2.75){return d*(7.5625*(b-=2.25/2.75)*b+.9375)+c}else{return d*(7.5625*(b-=2.625/2.75)*b+.984375)+c}},easeInOutBounce:function(a,b,c,d,e){if(b<e/2)return jQuery.easing.easeInBounce(a,b*2,0,d,e)*.5+c;return jQuery.easing.easeOutBounce(a,b*2-e,0,d,e)*.5+d*.5+c}})
/*
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 */
/*!
Waypoints - 4.0.1
Copyright © 2011-2016 Caleb Troughton
Licensed under the MIT license.
https://github.com/imakewebthings/waypoints/blob/master/licenses.txt
*/
!function(){"use strict";function t(o){if(!o)throw new Error("No options passed to Waypoint constructor");if(!o.element)throw new Error("No element option passed to Waypoint constructor");if(!o.handler)throw new Error("No handler option passed to Waypoint constructor");this.key="waypoint-"+e,this.options=t.Adapter.extend({},t.defaults,o),this.element=this.options.element,this.adapter=new t.Adapter(this.element),this.callback=o.handler,this.axis=this.options.horizontal?"horizontal":"vertical",this.enabled=this.options.enabled,this.triggerPoint=null,this.group=t.Group.findOrCreate({name:this.options.group,axis:this.axis}),this.context=t.Context.findOrCreateByElement(this.options.context),t.offsetAliases[this.options.offset]&&(this.options.offset=t.offsetAliases[this.options.offset]),this.group.add(this),this.context.add(this),i[this.key]=this,e+=1}var e=0,i={};t.prototype.queueTrigger=function(t){this.group.queueTrigger(this,t)},t.prototype.trigger=function(t){this.enabled&&this.callback&&this.callback.apply(this,t)},t.prototype.destroy=function(){this.context.remove(this),this.group.remove(this),delete i[this.key]},t.prototype.disable=function(){return this.enabled=!1,this},t.prototype.enable=function(){return this.context.refresh(),this.enabled=!0,this},t.prototype.next=function(){return this.group.next(this)},t.prototype.previous=function(){return this.group.previous(this)},t.invokeAll=function(t){var e=[];for(var o in i)e.push(i[o]);for(var n=0,r=e.length;r>n;n++)e[n][t]()},t.destroyAll=function(){t.invokeAll("destroy")},t.disableAll=function(){t.invokeAll("disable")},t.enableAll=function(){t.Context.refreshAll();for(var e in i)i[e].enabled=!0;return this},t.refreshAll=function(){t.Context.refreshAll()},t.viewportHeight=function(){return window.innerHeight||document.documentElement.clientHeight},t.viewportWidth=function(){return document.documentElement.clientWidth},t.adapters=[],t.defaults={context:window,continuous:!0,enabled:!0,group:"default",horizontal:!1,offset:0},t.offsetAliases={"bottom-in-view":function(){return this.context.innerHeight()-this.adapter.outerHeight()},"right-in-view":function(){return this.context.innerWidth()-this.adapter.outerWidth()}},window.Waypoint=t}(),function(){"use strict";function t(t){window.setTimeout(t,1e3/60)}function e(t){this.element=t,this.Adapter=n.Adapter,this.adapter=new this.Adapter(t),this.key="waypoint-context-"+i,this.didScroll=!1,this.didResize=!1,this.oldScroll={x:this.adapter.scrollLeft(),y:this.adapter.scrollTop()},this.waypoints={vertical:{},horizontal:{}},t.waypointContextKey=this.key,o[t.waypointContextKey]=this,i+=1,n.windowContext||(n.windowContext=!0,n.windowContext=new e(window)),this.createThrottledScrollHandler(),this.createThrottledResizeHandler()}var i=0,o={},n=window.Waypoint,r=window.onload;e.prototype.add=function(t){var e=t.options.horizontal?"horizontal":"vertical";this.waypoints[e][t.key]=t,this.refresh()},e.prototype.checkEmpty=function(){var t=this.Adapter.isEmptyObject(this.waypoints.horizontal),e=this.Adapter.isEmptyObject(this.waypoints.vertical),i=this.element==this.element.window;t&&e&&!i&&(this.adapter.off(".waypoints"),delete o[this.key])},e.prototype.createThrottledResizeHandler=function(){function t(){e.handleResize(),e.didResize=!1}var e=this;this.adapter.on("resize.waypoints",function(){e.didResize||(e.didResize=!0,n.requestAnimationFrame(t))})},e.prototype.createThrottledScrollHandler=function(){function t(){e.handleScroll(),e.didScroll=!1}var e=this;this.adapter.on("scroll.waypoints",function(){(!e.didScroll||n.isTouch)&&(e.didScroll=!0,n.requestAnimationFrame(t))})},e.prototype.handleResize=function(){n.Context.refreshAll()},e.prototype.handleScroll=function(){var t={},e={horizontal:{newScroll:this.adapter.scrollLeft(),oldScroll:this.oldScroll.x,forward:"right",backward:"left"},vertical:{newScroll:this.adapter.scrollTop(),oldScroll:this.oldScroll.y,forward:"down",backward:"up"}};for(var i in e){var o=e[i],n=o.newScroll>o.oldScroll,r=n?o.forward:o.backward;for(var s in this.waypoints[i]){var a=this.waypoints[i][s];if(null!==a.triggerPoint){var l=o.oldScroll<a.triggerPoint,h=o.newScroll>=a.triggerPoint,p=l&&h,u=!l&&!h;(p||u)&&(a.queueTrigger(r),t[a.group.id]=a.group)}}}for(var c in t)t[c].flushTriggers();this.oldScroll={x:e.horizontal.newScroll,y:e.vertical.newScroll}},e.prototype.innerHeight=function(){return this.element==this.element.window?n.viewportHeight():this.adapter.innerHeight()},e.prototype.remove=function(t){delete this.waypoints[t.axis][t.key],this.checkEmpty()},e.prototype.innerWidth=function(){return this.element==this.element.window?n.viewportWidth():this.adapter.innerWidth()},e.prototype.destroy=function(){var t=[];for(var e in this.waypoints)for(var i in this.waypoints[e])t.push(this.waypoints[e][i]);for(var o=0,n=t.length;n>o;o++)t[o].destroy()},e.prototype.refresh=function(){var t,e=this.element==this.element.window,i=e?void 0:this.adapter.offset(),o={};this.handleScroll(),t={horizontal:{contextOffset:e?0:i.left,contextScroll:e?0:this.oldScroll.x,contextDimension:this.innerWidth(),oldScroll:this.oldScroll.x,forward:"right",backward:"left",offsetProp:"left"},vertical:{contextOffset:e?0:i.top,contextScroll:e?0:this.oldScroll.y,contextDimension:this.innerHeight(),oldScroll:this.oldScroll.y,forward:"down",backward:"up",offsetProp:"top"}};for(var r in t){var s=t[r];for(var a in this.waypoints[r]){var l,h,p,u,c,d=this.waypoints[r][a],f=d.options.offset,w=d.triggerPoint,y=0,g=null==w;d.element!==d.element.window&&(y=d.adapter.offset()[s.offsetProp]),"function"==typeof f?f=f.apply(d):"string"==typeof f&&(f=parseFloat(f),d.options.offset.indexOf("%")>-1&&(f=Math.ceil(s.contextDimension*f/100))),l=s.contextScroll-s.contextOffset,d.triggerPoint=Math.floor(y+l-f),h=w<s.oldScroll,p=d.triggerPoint>=s.oldScroll,u=h&&p,c=!h&&!p,!g&&u?(d.queueTrigger(s.backward),o[d.group.id]=d.group):!g&&c?(d.queueTrigger(s.forward),o[d.group.id]=d.group):g&&s.oldScroll>=d.triggerPoint&&(d.queueTrigger(s.forward),o[d.group.id]=d.group)}}return n.requestAnimationFrame(function(){for(var t in o)o[t].flushTriggers()}),this},e.findOrCreateByElement=function(t){return e.findByElement(t)||new e(t)},e.refreshAll=function(){for(var t in o)o[t].refresh()},e.findByElement=function(t){return o[t.waypointContextKey]},window.onload=function(){r&&r(),e.refreshAll()},n.requestAnimationFrame=function(e){var i=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||t;i.call(window,e)},n.Context=e}(),function(){"use strict";function t(t,e){return t.triggerPoint-e.triggerPoint}function e(t,e){return e.triggerPoint-t.triggerPoint}function i(t){this.name=t.name,this.axis=t.axis,this.id=this.name+"-"+this.axis,this.waypoints=[],this.clearTriggerQueues(),o[this.axis][this.name]=this}var o={vertical:{},horizontal:{}},n=window.Waypoint;i.prototype.add=function(t){this.waypoints.push(t)},i.prototype.clearTriggerQueues=function(){this.triggerQueues={up:[],down:[],left:[],right:[]}},i.prototype.flushTriggers=function(){for(var i in this.triggerQueues){var o=this.triggerQueues[i],n="up"===i||"left"===i;o.sort(n?e:t);for(var r=0,s=o.length;s>r;r+=1){var a=o[r];(a.options.continuous||r===o.length-1)&&a.trigger([i])}}this.clearTriggerQueues()},i.prototype.next=function(e){this.waypoints.sort(t);var i=n.Adapter.inArray(e,this.waypoints),o=i===this.waypoints.length-1;return o?null:this.waypoints[i+1]},i.prototype.previous=function(e){this.waypoints.sort(t);var i=n.Adapter.inArray(e,this.waypoints);return i?this.waypoints[i-1]:null},i.prototype.queueTrigger=function(t,e){this.triggerQueues[e].push(t)},i.prototype.remove=function(t){var e=n.Adapter.inArray(t,this.waypoints);e>-1&&this.waypoints.splice(e,1)},i.prototype.first=function(){return this.waypoints[0]},i.prototype.last=function(){return this.waypoints[this.waypoints.length-1]},i.findOrCreate=function(t){return o[t.axis][t.name]||new i(t)},n.Group=i}(),function(){"use strict";function t(t){this.$element=e(t)}var e=window.jQuery,i=window.Waypoint;e.each(["innerHeight","innerWidth","off","offset","on","outerHeight","outerWidth","scrollLeft","scrollTop"],function(e,i){t.prototype[i]=function(){var t=Array.prototype.slice.call(arguments);return this.$element[i].apply(this.$element,t)}}),e.each(["extend","inArray","isEmptyObject"],function(i,o){t[o]=e[o]}),i.adapters.push({name:"jquery",Adapter:t}),i.Adapter=t}(),function(){"use strict";function t(t){return function(){var i=[],o=arguments[0];return t.isFunction(arguments[0])&&(o=t.extend({},arguments[1]),o.handler=arguments[0]),this.each(function(){var n=t.extend({},o,{element:this});"string"==typeof n.context&&(n.context=t(this).closest(n.context)[0]),i.push(new e(n))}),i}}var e=window.Waypoint;window.jQuery&&(window.jQuery.fn.waypoint=t(window.jQuery)),window.Zepto&&(window.Zepto.fn.waypoint=t(window.Zepto))}();
/* ------------- TEXT ANIMATION PART ---------------*/
$(document).ready(function () {
	var wow_animations = new WOW({
		boxClass: 'wow',
		animateClass: 'animated'
	});
	wow_animations.init();
});
/* ------------- TEXT ANIMATION END ----------------*/
// Easy Responsive Tabs Plugin
(function ($) {
    $.fn.extend({
        easyResponsiveTabs: function (options) {
            //Set the default values, use comma to separate the settings, example:
            var defaults = {
                type: 'default', //default, vertical, accordion;
                width: 'auto',
                fit: true,
                closed: false,
                activate: function(){}
            }
            //Variables
            var options = $.extend(defaults, options);            
            var opt = options, jtype = opt.type, jfit = opt.fit, jwidth = opt.width, vtabs = 'vertical', accord = 'accordion';

            //Events
            $(this).bind('tabactivate', function(e, currentTab) {
                if(typeof options.activate === 'function') {
                    options.activate.call(currentTab, e)
                }
            });

            //Main function
            this.each(function () {
                var $respTabs = $(this);
                var $respTabsList = $respTabs.find('ul.resp-tabs-list');
                $respTabs.find('ul.resp-tabs-list li').addClass('resp-tab-item');
                $respTabs.css({
                    'display': 'block',
                    'width': jwidth
                });

                $respTabs.find('.resp-tabs-container > div').addClass('resp-tab-content');
                jtab_options();
                //Properties Function
                function jtab_options() {
                    if (jtype == vtabs) {
                        $respTabs.addClass('resp-vtabs');
                    }
                    if (jfit == true) {
                        $respTabs.css({ width: '100%', margin: '0px' });
                    }
                    if (jtype == accord) {
                        $respTabs.addClass('resp-easy-accordion');
                        $respTabs.find('.resp-tabs-list').css('display', 'none');
                    }
                }

                //Assigning the h2 markup to accordion title
                var $tabItemh2;
                $respTabs.find('.resp-tab-content').before("<div class='resp-accordion' role='tab'><span class='resp-arrow'></span></div>");

                var itemCount = 0;
                $respTabs.find('.resp-accordion').each(function () {
                    $tabItemh2 = $(this);
                    var innertext = $respTabs.find('.resp-tab-item:eq(' + itemCount + ')').html();
                    $respTabs.find('.resp-accordion:eq(' + itemCount + ')').append(innertext);
                    $tabItemh2.attr('aria-controls', 'tab_item-' + (itemCount));
                    itemCount++;
                });

                //Assigning the 'aria-controls' to Tab items
                var count = 0,
                    $tabContent;
                $respTabs.find('.resp-tab-item').each(function () {
                    $tabItem = $(this);
                    $tabItem.attr('aria-controls', 'tab_item-' + (count));
                    $tabItem.attr('role', 'tab');

                    //First active tab, keep closed if option = 'closed' or option is 'accordion' and the element is in accordion mode 
                    if(options.closed !== true && !(options.closed === 'accordion' && !$respTabsList.is(':visible')) && !(options.closed === 'tabs' && $respTabsList.is(':visible'))) {                  
                        $respTabs.find('.resp-tab-item').first().addClass('resp-tab-active');
                        $respTabs.find('.resp-accordion').first().addClass('resp-tab-active');
                        $respTabs.find('.resp-tab-content').first().addClass('resp-tab-content-active').attr('style', 'display:block');
                    }

                    //Assigning the 'aria-labelledby' attr to tab-content
                    var tabcount = 0;
                    $respTabs.find('.resp-tab-content').each(function () {
                        $tabContent = $(this);
                        $tabContent.attr('aria-labelledby', 'tab_item-' + (tabcount));
                        tabcount++;
                    });
                    count++;
                });

                //Tab Click action function
                $respTabs.find("[role=tab]").each(function () {
                    var $currentTab = $(this);
                    $currentTab.click(function () {

                        var $tabAria = $currentTab.attr('aria-controls');

                        if ($currentTab.hasClass('resp-accordion') && $currentTab.hasClass('resp-tab-active')) {
                            $respTabs.find('.resp-tab-content-active').slideUp('', function () { $(this).addClass('resp-accordion-closed'); });
                            $currentTab.removeClass('resp-tab-active');
                            return false;
                        }
                        if (!$currentTab.hasClass('resp-tab-active') && $currentTab.hasClass('resp-accordion')) {
                            $respTabs.find('.resp-tab-active').removeClass('resp-tab-active');
                            $respTabs.find('.resp-tab-content-active').slideUp().removeClass('resp-tab-content-active resp-accordion-closed');
                            $respTabs.find("[aria-controls=" + $tabAria + "]").addClass('resp-tab-active');

                            $respTabs.find('.resp-tab-content[aria-labelledby = ' + $tabAria + ']').slideDown().addClass('resp-tab-content-active');
                        } else {
                            $respTabs.find('.resp-tab-active').removeClass('resp-tab-active');
                            $respTabs.find('.resp-tab-content-active').removeAttr('style').removeClass('resp-tab-content-active').removeClass('resp-accordion-closed');
                            $respTabs.find("[aria-controls=" + $tabAria + "]").addClass('resp-tab-active');
                            $respTabs.find('.resp-tab-content[aria-labelledby = ' + $tabAria + ']').addClass('resp-tab-content-active').attr('style', 'display:block');
                        }
                        //Trigger tab activation event
                        $currentTab.trigger('tabactivate', $currentTab);
                    });
                    //Window resize function                   
                    $(window).resize(function () {
                        $respTabs.find('.resp-accordion-closed').removeAttr('style');
                    });
                });
            });
        }
    });
})(jQuery);


function $JSCompiler_alias_THROW$$($jscomp_throw_param$$){throw $jscomp_throw_param$$;}var $JSCompiler_alias_VOID$$=void 0,$JSCompiler_alias_TRUE$$=true,$JSCompiler_alias_NULL$$=null,$JSCompiler_alias_FALSE$$=false,$JSCompiler_prototypeAlias$$,$goog$global$$=this;function $goog$nullFunction$$(){}
function $goog$typeOf$$($value$$38$$){var $s$$2$$=typeof $value$$38$$;if($s$$2$$=="object")if($value$$38$$){if($value$$38$$ instanceof Array)return"array";else if($value$$38$$ instanceof Object)return $s$$2$$;var $className$$1$$=Object.prototype.toString.call($value$$38$$);if($className$$1$$=="[object Window]")return"object";if($className$$1$$=="[object Array]"||typeof $value$$38$$.length=="number"&&typeof $value$$38$$.splice!="undefined"&&typeof $value$$38$$.propertyIsEnumerable!="undefined"&&!$value$$38$$.propertyIsEnumerable("splice"))return"array";
if($className$$1$$=="[object Function]"||typeof $value$$38$$.call!="undefined"&&typeof $value$$38$$.propertyIsEnumerable!="undefined"&&!$value$$38$$.propertyIsEnumerable("call"))return"function"}else return"null";else if($s$$2$$=="function"&&typeof $value$$38$$.call=="undefined")return"object";return $s$$2$$}function $goog$isArrayLike$$($val$$4$$){var $type$$44$$=$goog$typeOf$$($val$$4$$);return $type$$44$$=="array"||$type$$44$$=="object"&&typeof $val$$4$$.length=="number"}
function $goog$isString$$($val$$6$$){return typeof $val$$6$$=="string"}function $goog$isFunction$$($val$$9$$){return $goog$typeOf$$($val$$9$$)=="function"}function $goog$isObject$$($type$$45_val$$10$$){$type$$45_val$$10$$=$goog$typeOf$$($type$$45_val$$10$$);return $type$$45_val$$10$$=="object"||$type$$45_val$$10$$=="array"||$type$$45_val$$10$$=="function"}var $goog$UID_PROPERTY_$$="closure_uid_"+Math.floor(Math.random()*2147483648).toString(36),$goog$uidCounter_$$=0;
function $goog$bindNative_$$($fn$$,$selfObj$$1$$,$var_args$$17$$){return $fn$$.call.apply($fn$$.bind,arguments)}
function $goog$bindJs_$$($fn$$1$$,$selfObj$$2$$,$var_args$$18$$){$fn$$1$$||$JSCompiler_alias_THROW$$(Error());if(arguments.length>2){var $boundArgs$$=Array.prototype.slice.call(arguments,2);return function(){var $newArgs$$=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply($newArgs$$,$boundArgs$$);return $fn$$1$$.apply($selfObj$$2$$,$newArgs$$)}}else return function(){return $fn$$1$$.apply($selfObj$$2$$,arguments)}}
function $goog$bind$$($fn$$2$$,$selfObj$$3$$,$var_args$$19$$){$goog$bind$$=Function.prototype.bind&&Function.prototype.bind.toString().indexOf("native code")!=-1?$goog$bindNative_$$:$goog$bindJs_$$;return $goog$bind$$.apply($JSCompiler_alias_NULL$$,arguments)}
function $goog$partial$$($fn$$3$$,$var_args$$20$$){var $args$$=Array.prototype.slice.call(arguments,1);return function(){var $newArgs$$1$$=Array.prototype.slice.call(arguments);$newArgs$$1$$.unshift.apply($newArgs$$1$$,$args$$);return $fn$$3$$.apply(this,$newArgs$$1$$)}}var $goog$now$$=Date.now||function(){return+new Date};
function $goog$inherits$$($childCtor$$,$parentCtor$$){function $tempCtor$$(){}$tempCtor$$.prototype=$parentCtor$$.prototype;$childCtor$$.$superClass_$=$parentCtor$$.prototype;$childCtor$$.prototype=new $tempCtor$$};function $goog$Disposable$$(){}$goog$Disposable$$.prototype.$disposed_$=$JSCompiler_alias_FALSE$$;$goog$Disposable$$.prototype.$dispose$=function $$goog$Disposable$$$$$dispose$$(){if(!this.$disposed_$)this.$disposed_$=$JSCompiler_alias_TRUE$$,this.$disposeInternal$()};$goog$Disposable$$.prototype.$disposeInternal$=function $$goog$Disposable$$$$$disposeInternal$$(){this.$dependentDisposables_$&&$goog$disposeAll$$.apply($JSCompiler_alias_NULL$$,this.$dependentDisposables_$)};
function $goog$dispose$$($obj$$20$$){$obj$$20$$&&typeof $obj$$20$$.$dispose$=="function"&&$obj$$20$$.$dispose$()}function $goog$disposeAll$$($var_args$$22$$){for(var $i$$5$$=0,$len$$=arguments.length;$i$$5$$<$len$$;++$i$$5$$){var $disposable$$1$$=arguments[$i$$5$$];$goog$isArrayLike$$($disposable$$1$$)?$goog$disposeAll$$.apply($JSCompiler_alias_NULL$$,$disposable$$1$$):$goog$dispose$$($disposable$$1$$)}};var $goog$events$requiresSyntheticEventPropagation_$$;function $goog$events$Event$$($type$$47$$,$opt_target$$){this.type=$type$$47$$;this.currentTarget=this.target=$opt_target$$}$goog$inherits$$($goog$events$Event$$,$goog$Disposable$$);$goog$events$Event$$.prototype.$disposeInternal$=function $$goog$events$Event$$$$$disposeInternal$$(){delete this.type;delete this.target;delete this.currentTarget};$goog$events$Event$$.prototype.$propagationStopped_$=$JSCompiler_alias_FALSE$$;
$goog$events$Event$$.prototype.$returnValue_$=$JSCompiler_alias_TRUE$$;function $goog$debug$Error$$($opt_msg$$){this.stack=Error().stack||"";if($opt_msg$$)this.message=String($opt_msg$$)}$goog$inherits$$($goog$debug$Error$$,Error);$goog$debug$Error$$.prototype.name="CustomError";function $goog$string$subs$$($str$$12$$,$var_args$$23$$){for(var $i$$6$$=1;$i$$6$$<arguments.length;$i$$6$$++)var $replacement$$=String(arguments[$i$$6$$]).replace(/\$/g,"$$$$"),$str$$12$$=$str$$12$$.replace(/\%s/,$replacement$$);return $str$$12$$}function $goog$string$trim$$($str$$25$$){return $str$$25$$.replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")}
function $goog$string$htmlEscape$$($str$$31$$){if(!$goog$string$allRe_$$.test($str$$31$$))return $str$$31$$;$str$$31$$.indexOf("&")!=-1&&($str$$31$$=$str$$31$$.replace($goog$string$amperRe_$$,"&amp;"));$str$$31$$.indexOf("<")!=-1&&($str$$31$$=$str$$31$$.replace($goog$string$ltRe_$$,"&lt;"));$str$$31$$.indexOf(">")!=-1&&($str$$31$$=$str$$31$$.replace($goog$string$gtRe_$$,"&gt;"));$str$$31$$.indexOf('"')!=-1&&($str$$31$$=$str$$31$$.replace($goog$string$quotRe_$$,"&quot;"));return $str$$31$$}
var $goog$string$amperRe_$$=/&/g,$goog$string$ltRe_$$=/</g,$goog$string$gtRe_$$=/>/g,$goog$string$quotRe_$$=/\"/g,$goog$string$allRe_$$=/[&<>\"]/;
function $goog$string$compareVersions$$($version1$$,$version2$$){for(var $order$$=0,$v1Subs$$=$goog$string$trim$$(String($version1$$)).split("."),$v2Subs$$=$goog$string$trim$$(String($version2$$)).split("."),$subCount$$=Math.max($v1Subs$$.length,$v2Subs$$.length),$subIdx$$=0;$order$$==0&&$subIdx$$<$subCount$$;$subIdx$$++){var $v1Sub$$=$v1Subs$$[$subIdx$$]||"",$v2Sub$$=$v2Subs$$[$subIdx$$]||"",$v1CompParser$$=RegExp("(\\d*)(\\D*)","g"),$v2CompParser$$=RegExp("(\\d*)(\\D*)","g");do{var $v1Comp$$=$v1CompParser$$.exec($v1Sub$$)||
["","",""],$v2Comp$$=$v2CompParser$$.exec($v2Sub$$)||["","",""];if($v1Comp$$[0].length==0&&$v2Comp$$[0].length==0)break;$order$$=$goog$string$compareElements_$$($v1Comp$$[1].length==0?0:parseInt($v1Comp$$[1],10),$v2Comp$$[1].length==0?0:parseInt($v2Comp$$[1],10))||$goog$string$compareElements_$$($v1Comp$$[2].length==0,$v2Comp$$[2].length==0)||$goog$string$compareElements_$$($v1Comp$$[2],$v2Comp$$[2])}while($order$$==0)}return $order$$}
function $goog$string$compareElements_$$($left$$3$$,$right$$3$$){if($left$$3$$<$right$$3$$)return-1;else if($left$$3$$>$right$$3$$)return 1;return 0}var $goog$string$toCamelCaseCache_$$={};function $goog$string$toCamelCase$$($str$$42$$){return $goog$string$toCamelCaseCache_$$[$str$$42$$]||($goog$string$toCamelCaseCache_$$[$str$$42$$]=String($str$$42$$).replace(/\-([a-z])/g,function($all$$,$match$$){return $match$$.toUpperCase()}))};function $goog$asserts$AssertionError$$($messagePattern$$,$messageArgs$$){$messageArgs$$.unshift($messagePattern$$);$goog$debug$Error$$.call(this,$goog$string$subs$$.apply($JSCompiler_alias_NULL$$,$messageArgs$$));$messageArgs$$.shift();this.$messagePattern$=$messagePattern$$}$goog$inherits$$($goog$asserts$AssertionError$$,$goog$debug$Error$$);$goog$asserts$AssertionError$$.prototype.name="AssertionError";
function $goog$asserts$assert$$($condition$$,$opt_message$$8$$,$var_args$$25$$){if(!$condition$$){var $givenArgs$$inline_11$$=Array.prototype.slice.call(arguments,2),$message$$inline_12$$="Assertion failed";if($opt_message$$8$$){$message$$inline_12$$+=": "+$opt_message$$8$$;var $args$$inline_13$$=$givenArgs$$inline_11$$}$JSCompiler_alias_THROW$$(new $goog$asserts$AssertionError$$(""+$message$$inline_12$$,$args$$inline_13$$||[]))}};var $goog$array$ARRAY_PROTOTYPE_$$=Array.prototype,$goog$array$indexOf$$=$goog$array$ARRAY_PROTOTYPE_$$.indexOf?function($arr$$10$$,$obj$$22$$,$opt_fromIndex$$6$$){$goog$asserts$assert$$($arr$$10$$.length!=$JSCompiler_alias_NULL$$);return $goog$array$ARRAY_PROTOTYPE_$$.indexOf.call($arr$$10$$,$obj$$22$$,$opt_fromIndex$$6$$)}:function($arr$$11$$,$obj$$23$$,$fromIndex_i$$13_opt_fromIndex$$7$$){$fromIndex_i$$13_opt_fromIndex$$7$$=$fromIndex_i$$13_opt_fromIndex$$7$$==$JSCompiler_alias_NULL$$?0:$fromIndex_i$$13_opt_fromIndex$$7$$<
0?Math.max(0,$arr$$11$$.length+$fromIndex_i$$13_opt_fromIndex$$7$$):$fromIndex_i$$13_opt_fromIndex$$7$$;if($goog$isString$$($arr$$11$$))return!$goog$isString$$($obj$$23$$)||$obj$$23$$.length!=1?-1:$arr$$11$$.indexOf($obj$$23$$,$fromIndex_i$$13_opt_fromIndex$$7$$);for(;$fromIndex_i$$13_opt_fromIndex$$7$$<$arr$$11$$.length;$fromIndex_i$$13_opt_fromIndex$$7$$++)if($fromIndex_i$$13_opt_fromIndex$$7$$ in $arr$$11$$&&$arr$$11$$[$fromIndex_i$$13_opt_fromIndex$$7$$]===$obj$$23$$)return $fromIndex_i$$13_opt_fromIndex$$7$$;
return-1},$goog$array$forEach$$=$goog$array$ARRAY_PROTOTYPE_$$.forEach?function($arr$$14$$,$f$$,$opt_obj$$1$$){$goog$asserts$assert$$($arr$$14$$.length!=$JSCompiler_alias_NULL$$);$goog$array$ARRAY_PROTOTYPE_$$.forEach.call($arr$$14$$,$f$$,$opt_obj$$1$$)}:function($arr$$15$$,$f$$1$$,$opt_obj$$2$$){for(var $l$$2$$=$arr$$15$$.length,$arr2$$=$goog$isString$$($arr$$15$$)?$arr$$15$$.split(""):$arr$$15$$,$i$$15$$=0;$i$$15$$<$l$$2$$;$i$$15$$++)$i$$15$$ in $arr2$$&&$f$$1$$.call($opt_obj$$2$$,$arr2$$[$i$$15$$],
$i$$15$$,$arr$$15$$)},$goog$array$map$$=$goog$array$ARRAY_PROTOTYPE_$$.map?function($arr$$19$$,$f$$5$$,$opt_obj$$6$$){$goog$asserts$assert$$($arr$$19$$.length!=$JSCompiler_alias_NULL$$);return $goog$array$ARRAY_PROTOTYPE_$$.map.call($arr$$19$$,$f$$5$$,$opt_obj$$6$$)}:function($arr$$20$$,$f$$6$$,$opt_obj$$7$$){for(var $l$$5$$=$arr$$20$$.length,$res$$1$$=Array($l$$5$$),$arr2$$3$$=$goog$isString$$($arr$$20$$)?$arr$$20$$.split(""):$arr$$20$$,$i$$18$$=0;$i$$18$$<$l$$5$$;$i$$18$$++)$i$$18$$ in $arr2$$3$$&&
($res$$1$$[$i$$18$$]=$f$$6$$.call($opt_obj$$7$$,$arr2$$3$$[$i$$18$$],$i$$18$$,$arr$$20$$));return $res$$1$$};function $goog$array$concat$$($var_args$$34$$){return $goog$array$ARRAY_PROTOTYPE_$$.concat.apply($goog$array$ARRAY_PROTOTYPE_$$,arguments)}
function $goog$array$clone$$($arr$$41$$){if($goog$typeOf$$($arr$$41$$)=="array")return $goog$array$concat$$($arr$$41$$);else{for(var $rv$$3$$=[],$i$$30$$=0,$len$$1$$=$arr$$41$$.length;$i$$30$$<$len$$1$$;$i$$30$$++)$rv$$3$$[$i$$30$$]=$arr$$41$$[$i$$30$$];return $rv$$3$$}}
function $goog$array$slice$$($arr$$43$$,$start$$5$$,$opt_end$$5$$){$goog$asserts$assert$$($arr$$43$$.length!=$JSCompiler_alias_NULL$$);return arguments.length<=2?$goog$array$ARRAY_PROTOTYPE_$$.slice.call($arr$$43$$,$start$$5$$):$goog$array$ARRAY_PROTOTYPE_$$.slice.call($arr$$43$$,$start$$5$$,$opt_end$$5$$)};function $goog$dom$classes$add$$($element$$10$$,$var_args$$39$$){var $className$$inline_222_classes$$;$className$$inline_222_classes$$=($className$$inline_222_classes$$=$element$$10$$.className)&&typeof $className$$inline_222_classes$$.split=="function"?$className$$inline_222_classes$$.split(/\s+/):[];var $args$$3_args$$inline_20$$=$goog$array$slice$$(arguments,1),$b$$4_classes$$inline_19$$;$b$$4_classes$$inline_19$$=$className$$inline_222_classes$$;for(var $rv$$inline_21$$=0,$i$$inline_22$$=0;$i$$inline_22$$<
$args$$3_args$$inline_20$$.length;$i$$inline_22$$++)$goog$array$indexOf$$($b$$4_classes$$inline_19$$,$args$$3_args$$inline_20$$[$i$$inline_22$$])>=0||($b$$4_classes$$inline_19$$.push($args$$3_args$$inline_20$$[$i$$inline_22$$]),$rv$$inline_21$$++);$b$$4_classes$$inline_19$$=$rv$$inline_21$$==$args$$3_args$$inline_20$$.length;$element$$10$$.className=$className$$inline_222_classes$$.join(" ");return $b$$4_classes$$inline_19$$};var $goog$userAgent$detectedOpera_$$,$goog$userAgent$detectedIe_$$,$goog$userAgent$detectedWebkit_$$,$goog$userAgent$detectedGecko_$$;function $goog$userAgent$getUserAgentString$$(){return $goog$global$$.navigator?$goog$global$$.navigator.userAgent:$JSCompiler_alias_NULL$$}$goog$userAgent$detectedGecko_$$=$goog$userAgent$detectedWebkit_$$=$goog$userAgent$detectedIe_$$=$goog$userAgent$detectedOpera_$$=$JSCompiler_alias_FALSE$$;var $ua$$inline_26$$;
if($ua$$inline_26$$=$goog$userAgent$getUserAgentString$$()){var $navigator$$inline_27$$=$goog$global$$.navigator;$goog$userAgent$detectedOpera_$$=$ua$$inline_26$$.indexOf("Opera")==0;$goog$userAgent$detectedIe_$$=!$goog$userAgent$detectedOpera_$$&&$ua$$inline_26$$.indexOf("MSIE")!=-1;$goog$userAgent$detectedWebkit_$$=!$goog$userAgent$detectedOpera_$$&&$ua$$inline_26$$.indexOf("WebKit")!=-1;$goog$userAgent$detectedGecko_$$=!$goog$userAgent$detectedOpera_$$&&!$goog$userAgent$detectedWebkit_$$&&$navigator$$inline_27$$.product==
"Gecko"}var $goog$userAgent$IE$$=$goog$userAgent$detectedIe_$$,$goog$userAgent$GECKO$$=$goog$userAgent$detectedGecko_$$,$goog$userAgent$WEBKIT$$=$goog$userAgent$detectedWebkit_$$,$navigator$$inline_30$$=$goog$global$$.navigator,$goog$userAgent$MAC$$=($navigator$$inline_30$$&&$navigator$$inline_30$$.platform||"").indexOf("Mac")!=-1,$goog$userAgent$VERSION$$;
a:{var $version$$inline_38$$="",$re$$inline_39$$;if($goog$userAgent$detectedOpera_$$&&$goog$global$$.opera)var $operaVersion$$inline_40$$=$goog$global$$.opera.version,$version$$inline_38$$=typeof $operaVersion$$inline_40$$=="function"?$operaVersion$$inline_40$$():$operaVersion$$inline_40$$;else if($goog$userAgent$GECKO$$?$re$$inline_39$$=/rv\:([^\);]+)(\)|;)/:$goog$userAgent$IE$$?$re$$inline_39$$=/MSIE\s+([^\);]+)(\)|;)/:$goog$userAgent$WEBKIT$$&&($re$$inline_39$$=/WebKit\/(\S+)/),$re$$inline_39$$)var $arr$$inline_41$$=
$re$$inline_39$$.exec($goog$userAgent$getUserAgentString$$()),$version$$inline_38$$=$arr$$inline_41$$?$arr$$inline_41$$[1]:"";if($goog$userAgent$IE$$){var $docMode$$inline_42$$,$doc$$inline_225$$=$goog$global$$.document;$docMode$$inline_42$$=$doc$$inline_225$$?$doc$$inline_225$$.documentMode:$JSCompiler_alias_VOID$$;if($docMode$$inline_42$$>parseFloat($version$$inline_38$$)){$goog$userAgent$VERSION$$=String($docMode$$inline_42$$);break a}}$goog$userAgent$VERSION$$=$version$$inline_38$$}
var $goog$userAgent$isVersionCache_$$={};function $goog$userAgent$isVersion$$($version$$8$$){return $goog$userAgent$isVersionCache_$$[$version$$8$$]||($goog$userAgent$isVersionCache_$$[$version$$8$$]=$goog$string$compareVersions$$($goog$userAgent$VERSION$$,$version$$8$$)>=0)}var $goog$userAgent$isDocumentModeCache_$$={};
function $goog$userAgent$isDocumentMode$$(){return $goog$userAgent$isDocumentModeCache_$$[9]||($goog$userAgent$isDocumentModeCache_$$[9]=$goog$userAgent$IE$$&&document.documentMode&&document.documentMode>=9)};var $goog$dom$BrowserFeature$CAN_ADD_NAME_OR_TYPE_ATTRIBUTES$$=!$goog$userAgent$IE$$||$goog$userAgent$isDocumentMode$$();!$goog$userAgent$GECKO$$&&!$goog$userAgent$IE$$||$goog$userAgent$IE$$&&$goog$userAgent$isDocumentMode$$()||$goog$userAgent$GECKO$$&&$goog$userAgent$isVersion$$("1.9.1");var $goog$dom$BrowserFeature$CAN_USE_INNER_TEXT$$=$goog$userAgent$IE$$&&!$goog$userAgent$isVersion$$("9");function $goog$object$forEach$$($obj$$31$$,$f$$18$$){for(var $key$$19$$ in $obj$$31$$)$f$$18$$.call($JSCompiler_alias_VOID$$,$obj$$31$$[$key$$19$$],$key$$19$$,$obj$$31$$)}var $goog$object$PROTOTYPE_FIELDS_$$="constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",");
function $goog$object$extend$$($target$$38$$,$var_args$$42$$){for(var $key$$42$$,$source$$2$$,$i$$48$$=1;$i$$48$$<arguments.length;$i$$48$$++){$source$$2$$=arguments[$i$$48$$];for($key$$42$$ in $source$$2$$)$target$$38$$[$key$$42$$]=$source$$2$$[$key$$42$$];for(var $j$$4$$=0;$j$$4$$<$goog$object$PROTOTYPE_FIELDS_$$.length;$j$$4$$++)$key$$42$$=$goog$object$PROTOTYPE_FIELDS_$$[$j$$4$$],Object.prototype.hasOwnProperty.call($source$$2$$,$key$$42$$)&&($target$$38$$[$key$$42$$]=$source$$2$$[$key$$42$$])}}
;function $goog$dom$getElementsByTagNameAndClass_$$($className$$10_opt_tag$$1_tagName$$1$$,$opt_class$$1$$,$els_opt_el$$3_parent$$5$$){$els_opt_el$$3_parent$$5$$=$els_opt_el$$3_parent$$5$$||document;$className$$10_opt_tag$$1_tagName$$1$$=$className$$10_opt_tag$$1_tagName$$1$$&&$className$$10_opt_tag$$1_tagName$$1$$!="*"?$className$$10_opt_tag$$1_tagName$$1$$.toUpperCase():"";if($els_opt_el$$3_parent$$5$$.querySelectorAll&&$els_opt_el$$3_parent$$5$$.querySelector&&(!$goog$userAgent$WEBKIT$$||document.compatMode==
"CSS1Compat"||$goog$userAgent$isVersion$$("528"))&&($className$$10_opt_tag$$1_tagName$$1$$||$opt_class$$1$$))return $els_opt_el$$3_parent$$5$$.querySelectorAll($className$$10_opt_tag$$1_tagName$$1$$+($opt_class$$1$$?"."+$opt_class$$1$$:""));if($opt_class$$1$$&&$els_opt_el$$3_parent$$5$$.getElementsByClassName)if($els_opt_el$$3_parent$$5$$=$els_opt_el$$3_parent$$5$$.getElementsByClassName($opt_class$$1$$),$className$$10_opt_tag$$1_tagName$$1$$){for(var $arrayLike$$={},$len$$2$$=0,$i$$51$$=0,$el$$1$$;$el$$1$$=
$els_opt_el$$3_parent$$5$$[$i$$51$$];$i$$51$$++)$className$$10_opt_tag$$1_tagName$$1$$==$el$$1$$.nodeName&&($arrayLike$$[$len$$2$$++]=$el$$1$$);$arrayLike$$.length=$len$$2$$;return $arrayLike$$}else return $els_opt_el$$3_parent$$5$$;$els_opt_el$$3_parent$$5$$=$els_opt_el$$3_parent$$5$$.getElementsByTagName($className$$10_opt_tag$$1_tagName$$1$$||"*");if($opt_class$$1$$){$arrayLike$$={};for($i$$51$$=$len$$2$$=0;$el$$1$$=$els_opt_el$$3_parent$$5$$[$i$$51$$];$i$$51$$++)$className$$10_opt_tag$$1_tagName$$1$$=
$el$$1$$.className,typeof $className$$10_opt_tag$$1_tagName$$1$$.split=="function"&&$goog$array$indexOf$$($className$$10_opt_tag$$1_tagName$$1$$.split(/\s+/),$opt_class$$1$$)>=0&&($arrayLike$$[$len$$2$$++]=$el$$1$$);$arrayLike$$.length=$len$$2$$;return $arrayLike$$}else return $els_opt_el$$3_parent$$5$$}
function $goog$dom$setProperties$$($element$$18$$,$properties$$){$goog$object$forEach$$($properties$$,function($val$$19$$,$key$$43$$){$key$$43$$=="style"?$element$$18$$.style.cssText=$val$$19$$:$key$$43$$=="class"?$element$$18$$.className=$val$$19$$:$key$$43$$=="for"?$element$$18$$.htmlFor=$val$$19$$:$key$$43$$ in $goog$dom$DIRECT_ATTRIBUTE_MAP_$$?$element$$18$$.setAttribute($goog$dom$DIRECT_ATTRIBUTE_MAP_$$[$key$$43$$],$val$$19$$):$key$$43$$.lastIndexOf("aria-",0)==0?$element$$18$$.setAttribute($key$$43$$,
$val$$19$$):$element$$18$$[$key$$43$$]=$val$$19$$})}var $goog$dom$DIRECT_ATTRIBUTE_MAP_$$={cellpadding:"cellPadding",cellspacing:"cellSpacing",colspan:"colSpan",rowspan:"rowSpan",valign:"vAlign",height:"height",width:"width",usemap:"useMap",frameborder:"frameBorder",maxlength:"maxLength",type:"type"};
function $goog$dom$createDom$$($tagName$$2$$,$opt_attributes$$,$var_args$$45$$){var $args$$inline_52$$=arguments,$doc$$inline_53$$=document,$element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$=$args$$inline_52$$[0],$attributes$$inline_55$$=$args$$inline_52$$[1];if(!$goog$dom$BrowserFeature$CAN_ADD_NAME_OR_TYPE_ATTRIBUTES$$&&$attributes$$inline_55$$&&($attributes$$inline_55$$.name||$attributes$$inline_55$$.type)){$element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$=["<",$element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$];
$attributes$$inline_55$$.name&&$element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$.push(' name="',$goog$string$htmlEscape$$($attributes$$inline_55$$.name),'"');if($attributes$$inline_55$$.type){$element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$.push(' type="',$goog$string$htmlEscape$$($attributes$$inline_55$$.type),'"');var $clone$$inline_57$$={};$goog$object$extend$$($clone$$inline_57$$,$attributes$$inline_55$$);$attributes$$inline_55$$=$clone$$inline_57$$;delete $attributes$$inline_55$$.type}$element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$.push(">");
$element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$=$element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$.join("")}$element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$=$doc$$inline_53$$.createElement($element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$);if($attributes$$inline_55$$)$goog$isString$$($attributes$$inline_55$$)?$element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$.className=$attributes$$inline_55$$:$goog$typeOf$$($attributes$$inline_55$$)==
"array"?$goog$dom$classes$add$$.apply($JSCompiler_alias_NULL$$,[$element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$].concat($attributes$$inline_55$$)):$goog$dom$setProperties$$($element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$,$attributes$$inline_55$$);$args$$inline_52$$.length>2&&$goog$dom$append_$$($doc$$inline_53$$,$element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$,$args$$inline_52$$);return $element$$inline_58_tagName$$inline_54_tagNameArr$$inline_56$$}
function $goog$dom$append_$$($doc$$12$$,$parent$$6$$,$args$$8$$){function $childHandler$$($child$$1$$){$child$$1$$&&$parent$$6$$.appendChild($goog$isString$$($child$$1$$)?$doc$$12$$.createTextNode($child$$1$$):$child$$1$$)}for(var $i$$52$$=2;$i$$52$$<$args$$8$$.length;$i$$52$$++){var $arg$$5$$=$args$$8$$[$i$$52$$];if($goog$isArrayLike$$($arg$$5$$)&&!($goog$isObject$$($arg$$5$$)&&$arg$$5$$.nodeType>0)){var $JSCompiler_inline_result$$60$$;a:{if($arg$$5$$&&typeof $arg$$5$$.length=="number")if($goog$isObject$$($arg$$5$$)){$JSCompiler_inline_result$$60$$=
typeof $arg$$5$$.item=="function"||typeof $arg$$5$$.item=="string";break a}else if($goog$isFunction$$($arg$$5$$)){$JSCompiler_inline_result$$60$$=typeof $arg$$5$$.item=="function";break a}$JSCompiler_inline_result$$60$$=$JSCompiler_alias_FALSE$$}$goog$array$forEach$$($JSCompiler_inline_result$$60$$?$goog$array$clone$$($arg$$5$$):$arg$$5$$,$childHandler$$)}else $childHandler$$($arg$$5$$)}}
var $goog$dom$TAGS_TO_IGNORE_$$={SCRIPT:1,STYLE:1,HEAD:1,IFRAME:1,OBJECT:1},$goog$dom$PREDEFINED_TAG_VALUES_$$={IMG:" ",BR:"\n"};
function $goog$dom$getTextContent$$($node$$16_textContent$$){if($goog$dom$BrowserFeature$CAN_USE_INNER_TEXT$$&&"innerText"in $node$$16_textContent$$)$node$$16_textContent$$=$node$$16_textContent$$.innerText.replace(/(\r\n|\r|\n)/g,"\n");else{var $buf$$=[];$goog$dom$getTextContent_$$($node$$16_textContent$$,$buf$$,$JSCompiler_alias_TRUE$$);$node$$16_textContent$$=$buf$$.join("")}$node$$16_textContent$$=$node$$16_textContent$$.replace(/ \xAD /g," ").replace(/\xAD/g,"");$node$$16_textContent$$=$node$$16_textContent$$.replace(/\u200B/g,
"");$goog$dom$BrowserFeature$CAN_USE_INNER_TEXT$$||($node$$16_textContent$$=$node$$16_textContent$$.replace(/ +/g," "));$node$$16_textContent$$!=" "&&($node$$16_textContent$$=$node$$16_textContent$$.replace(/^\s*/,""));return $node$$16_textContent$$}
function $goog$dom$getTextContent_$$($child$$7_node$$18$$,$buf$$2$$,$normalizeWhitespace$$){if(!($child$$7_node$$18$$.nodeName in $goog$dom$TAGS_TO_IGNORE_$$))if($child$$7_node$$18$$.nodeType==3)$normalizeWhitespace$$?$buf$$2$$.push(String($child$$7_node$$18$$.nodeValue).replace(/(\r\n|\r|\n)/g,"")):$buf$$2$$.push($child$$7_node$$18$$.nodeValue);else if($child$$7_node$$18$$.nodeName in $goog$dom$PREDEFINED_TAG_VALUES_$$)$buf$$2$$.push($goog$dom$PREDEFINED_TAG_VALUES_$$[$child$$7_node$$18$$.nodeName]);
else for($child$$7_node$$18$$=$child$$7_node$$18$$.firstChild;$child$$7_node$$18$$;)$goog$dom$getTextContent_$$($child$$7_node$$18$$,$buf$$2$$,$normalizeWhitespace$$),$child$$7_node$$18$$=$child$$7_node$$18$$.nextSibling}
function $goog$dom$getAncestorByTagNameAndClass$$($element$$26$$,$opt_tag$$2$$){var $tagName$$4$$=$opt_tag$$2$$?$opt_tag$$2$$.toUpperCase():$JSCompiler_alias_NULL$$;return $goog$dom$getAncestor$$($element$$26$$,function($node$$21$$){return(!$tagName$$4$$||$node$$21$$.nodeName==$tagName$$4$$)&&$JSCompiler_alias_TRUE$$})}
function $goog$dom$getAncestor$$($element$$28$$,$matcher$$){for(var $steps$$=0;$element$$28$$;){if($matcher$$($element$$28$$))return $element$$28$$;$element$$28$$=$element$$28$$.parentNode;$steps$$++}return $JSCompiler_alias_NULL$$};function $goog$style$setStyle_$$($element$$31$$,$value$$55$$,$style$$2$$){$element$$31$$.style[$goog$string$toCamelCase$$($style$$2$$)]=$value$$55$$};function $picnet$ui$filter$FilterState$$($id$$2$$,$value$$63$$,$idx$$,$type$$50$$){this.id=$id$$2$$;this.value=$value$$63$$;this.$idx$=$idx$$;this.type=$type$$50$$}$picnet$ui$filter$FilterState$$.prototype.toString=function $$picnet$ui$filter$FilterState$$$$toString$(){return"id["+this.id+"] value["+this.value+"] idx["+this.$idx$+"] type["+this.type+"]"};function $picnet$ui$filter$GenericListFilterOptions$$(){}$picnet$ui$filter$GenericListFilterOptions$$.prototype.additionalFilterTriggers=[];$picnet$ui$filter$GenericListFilterOptions$$.prototype.clearFiltersControls=[];$picnet$ui$filter$GenericListFilterOptions$$.prototype.filterDelay=250;$picnet$ui$filter$GenericListFilterOptions$$.prototype.filterToolTipMessage='Quotes (") match phrases. (not) excludes a match from the results. (or) can be used to do Or searches. I.e. [red or blue] will match either red or blue. Numeric values support >=, >, <=, <, = and != operators.';
$picnet$ui$filter$GenericListFilterOptions$$.prototype.enableCookies=$JSCompiler_alias_TRUE$$;$picnet$ui$filter$GenericListFilterOptions$$.prototype.matchingElement=$JSCompiler_alias_NULL$$;$picnet$ui$filter$GenericListFilterOptions$$.prototype.filteringElements=$JSCompiler_alias_NULL$$;$picnet$ui$filter$GenericListFilterOptions$$.prototype.filteredElements=$JSCompiler_alias_NULL$$;function $picnet$ui$filter$TableFilterOptions$$(){}$goog$inherits$$($picnet$ui$filter$TableFilterOptions$$,$picnet$ui$filter$GenericListFilterOptions$$);function $goog$net$Cookies$$($context$$){this.$document_$=$context$$}var $goog$net$Cookies$SPLIT_RE_$$=/\s*;\s*/;
$goog$net$Cookies$$.prototype.set=function $$goog$net$Cookies$$$$set$($name$$61$$,$value$$65$$,$expiresStr_opt_maxAge$$,$opt_path_pathStr$$,$domainStr_opt_domain$$,$opt_secure_secureStr$$){/[;=\s]/.test($name$$61$$)&&$JSCompiler_alias_THROW$$(Error('Invalid cookie name "'+$name$$61$$+'"'));/[;\r\n]/.test($value$$65$$)&&$JSCompiler_alias_THROW$$(Error('Invalid cookie value "'+$value$$65$$+'"'));$expiresStr_opt_maxAge$$!==$JSCompiler_alias_VOID$$||($expiresStr_opt_maxAge$$=-1);$domainStr_opt_domain$$=
$domainStr_opt_domain$$?";domain="+$domainStr_opt_domain$$:"";$opt_path_pathStr$$=$opt_path_pathStr$$?";path="+$opt_path_pathStr$$:"";$opt_secure_secureStr$$=$opt_secure_secureStr$$?";secure":"";$expiresStr_opt_maxAge$$=$expiresStr_opt_maxAge$$<0?"":$expiresStr_opt_maxAge$$==0?";expires="+(new Date(1970,1,1)).toUTCString():";expires="+(new Date($goog$now$$()+$expiresStr_opt_maxAge$$*1E3)).toUTCString();this.$document_$.cookie=$name$$61$$+"="+$value$$65$$+$domainStr_opt_domain$$+$opt_path_pathStr$$+
$expiresStr_opt_maxAge$$+$opt_secure_secureStr$$};$goog$net$Cookies$$.prototype.get=function $$goog$net$Cookies$$$$get$($name$$62$$,$opt_default$$){for(var $nameEq$$=$name$$62$$+"=",$parts$$3$$=(this.$document_$.cookie||"").split($goog$net$Cookies$SPLIT_RE_$$),$i$$58$$=0,$part$$2$$;$part$$2$$=$parts$$3$$[$i$$58$$];$i$$58$$++)if($part$$2$$.indexOf($nameEq$$)==0)return $part$$2$$.substr($nameEq$$.length);return $opt_default$$};var $goog$net$cookies$$=new $goog$net$Cookies$$(document);
$goog$net$cookies$$.$MAX_COOKIE_LENGTH$=3950;!$goog$userAgent$IE$$||$goog$userAgent$isDocumentMode$$();$goog$userAgent$IE$$&&$goog$userAgent$isVersion$$("8");var $goog$reflect$sinkValue$$=new Function("a","return a");function $goog$events$BrowserEvent$$($opt_e$$,$opt_currentTarget$$){$opt_e$$&&this.$init$($opt_e$$,$opt_currentTarget$$)}$goog$inherits$$($goog$events$BrowserEvent$$,$goog$events$Event$$);$JSCompiler_prototypeAlias$$=$goog$events$BrowserEvent$$.prototype;$JSCompiler_prototypeAlias$$.target=$JSCompiler_alias_NULL$$;$JSCompiler_prototypeAlias$$.relatedTarget=$JSCompiler_alias_NULL$$;$JSCompiler_prototypeAlias$$.offsetX=0;$JSCompiler_prototypeAlias$$.offsetY=0;$JSCompiler_prototypeAlias$$.clientX=0;
$JSCompiler_prototypeAlias$$.clientY=0;$JSCompiler_prototypeAlias$$.screenX=0;$JSCompiler_prototypeAlias$$.screenY=0;$JSCompiler_prototypeAlias$$.button=0;$JSCompiler_prototypeAlias$$.keyCode=0;$JSCompiler_prototypeAlias$$.charCode=0;$JSCompiler_prototypeAlias$$.ctrlKey=$JSCompiler_alias_FALSE$$;$JSCompiler_prototypeAlias$$.altKey=$JSCompiler_alias_FALSE$$;$JSCompiler_prototypeAlias$$.shiftKey=$JSCompiler_alias_FALSE$$;$JSCompiler_prototypeAlias$$.metaKey=$JSCompiler_alias_FALSE$$;
$JSCompiler_prototypeAlias$$.$platformModifierKey$=$JSCompiler_alias_FALSE$$;$JSCompiler_prototypeAlias$$.$event_$=$JSCompiler_alias_NULL$$;
$JSCompiler_prototypeAlias$$.$init$=function $$JSCompiler_prototypeAlias$$$$init$$($e$$9$$,$opt_currentTarget$$1$$){var $type$$52$$=this.type=$e$$9$$.type;$goog$events$Event$$.call(this,$type$$52$$);this.target=$e$$9$$.target||$e$$9$$.srcElement;this.currentTarget=$opt_currentTarget$$1$$;var $relatedTarget$$=$e$$9$$.relatedTarget;if($relatedTarget$$){if($goog$userAgent$GECKO$$){var $JSCompiler_inline_result$$69$$;a:{try{$goog$reflect$sinkValue$$($relatedTarget$$.nodeName);$JSCompiler_inline_result$$69$$=
$JSCompiler_alias_TRUE$$;break a}catch($e$$inline_72$$){}$JSCompiler_inline_result$$69$$=$JSCompiler_alias_FALSE$$}$JSCompiler_inline_result$$69$$||($relatedTarget$$=$JSCompiler_alias_NULL$$)}}else if($type$$52$$=="mouseover")$relatedTarget$$=$e$$9$$.fromElement;else if($type$$52$$=="mouseout")$relatedTarget$$=$e$$9$$.toElement;this.relatedTarget=$relatedTarget$$;this.offsetX=$e$$9$$.offsetX!==$JSCompiler_alias_VOID$$?$e$$9$$.offsetX:$e$$9$$.layerX;this.offsetY=$e$$9$$.offsetY!==$JSCompiler_alias_VOID$$?
$e$$9$$.offsetY:$e$$9$$.layerY;this.clientX=$e$$9$$.clientX!==$JSCompiler_alias_VOID$$?$e$$9$$.clientX:$e$$9$$.pageX;this.clientY=$e$$9$$.clientY!==$JSCompiler_alias_VOID$$?$e$$9$$.clientY:$e$$9$$.pageY;this.screenX=$e$$9$$.screenX||0;this.screenY=$e$$9$$.screenY||0;this.button=$e$$9$$.button;this.keyCode=$e$$9$$.keyCode||0;this.charCode=$e$$9$$.charCode||($type$$52$$=="keypress"?$e$$9$$.keyCode:0);this.ctrlKey=$e$$9$$.ctrlKey;this.altKey=$e$$9$$.altKey;this.shiftKey=$e$$9$$.shiftKey;this.metaKey=
$e$$9$$.metaKey;this.$platformModifierKey$=$goog$userAgent$MAC$$?$e$$9$$.metaKey:$e$$9$$.ctrlKey;this.state=$e$$9$$.state;this.$event_$=$e$$9$$;delete this.$returnValue_$;delete this.$propagationStopped_$};$JSCompiler_prototypeAlias$$.$disposeInternal$=function $$JSCompiler_prototypeAlias$$$$disposeInternal$$(){$goog$events$BrowserEvent$$.$superClass_$.$disposeInternal$.call(this);this.relatedTarget=this.currentTarget=this.target=this.$event_$=$JSCompiler_alias_NULL$$};function $goog$events$Listener$$(){}var $goog$events$Listener$counter_$$=0;$JSCompiler_prototypeAlias$$=$goog$events$Listener$$.prototype;$JSCompiler_prototypeAlias$$.key=0;$JSCompiler_prototypeAlias$$.$removed$=$JSCompiler_alias_FALSE$$;$JSCompiler_prototypeAlias$$.$callOnce$=$JSCompiler_alias_FALSE$$;
$JSCompiler_prototypeAlias$$.$init$=function $$JSCompiler_prototypeAlias$$$$init$$($listener$$26$$,$proxy$$,$src$$8$$,$type$$53$$,$capture$$,$opt_handler$$){$goog$isFunction$$($listener$$26$$)?this.$isFunctionListener_$=$JSCompiler_alias_TRUE$$:$listener$$26$$&&$listener$$26$$.handleEvent&&$goog$isFunction$$($listener$$26$$.handleEvent)?this.$isFunctionListener_$=$JSCompiler_alias_FALSE$$:$JSCompiler_alias_THROW$$(Error("Invalid listener argument"));this.$listener$=$listener$$26$$;this.$proxy$=$proxy$$;
this.src=$src$$8$$;this.type=$type$$53$$;this.capture=!!$capture$$;this.$handler$=$opt_handler$$;this.$callOnce$=$JSCompiler_alias_FALSE$$;this.key=++$goog$events$Listener$counter_$$;this.$removed$=$JSCompiler_alias_FALSE$$};$JSCompiler_prototypeAlias$$.handleEvent=function $$JSCompiler_prototypeAlias$$$handleEvent$($eventObject$$){return this.$isFunctionListener_$?this.$listener$.call(this.$handler$||this.src,$eventObject$$):this.$listener$.handleEvent.call(this.$listener$,$eventObject$$)};function $goog$structs$SimplePool$$($initialCount$$,$maxCount$$){this.$maxCount_$=$maxCount$$;this.$freeQueue_$=[];$initialCount$$>this.$maxCount_$&&$JSCompiler_alias_THROW$$(Error("[goog.structs.SimplePool] Initial cannot be greater than max"));for(var $i$$inline_79$$=0;$i$$inline_79$$<$initialCount$$;$i$$inline_79$$++)this.$freeQueue_$.push(this.$createObjectFn_$?this.$createObjectFn_$():{})}$goog$inherits$$($goog$structs$SimplePool$$,$goog$Disposable$$);
$goog$structs$SimplePool$$.prototype.$createObjectFn_$=$JSCompiler_alias_NULL$$;$goog$structs$SimplePool$$.prototype.$disposeObjectFn_$=$JSCompiler_alias_NULL$$;
function $JSCompiler_StaticMethods_getObject$$($JSCompiler_StaticMethods_getObject$self$$){return $JSCompiler_StaticMethods_getObject$self$$.$freeQueue_$.length?$JSCompiler_StaticMethods_getObject$self$$.$freeQueue_$.pop():$JSCompiler_StaticMethods_getObject$self$$.$createObjectFn_$?$JSCompiler_StaticMethods_getObject$self$$.$createObjectFn_$():{}}
function $JSCompiler_StaticMethods_releaseObject$$($JSCompiler_StaticMethods_releaseObject$self$$,$obj$$61$$){$JSCompiler_StaticMethods_releaseObject$self$$.$freeQueue_$.length<$JSCompiler_StaticMethods_releaseObject$self$$.$maxCount_$?$JSCompiler_StaticMethods_releaseObject$self$$.$freeQueue_$.push($obj$$61$$):$JSCompiler_StaticMethods_disposeObject$$($JSCompiler_StaticMethods_releaseObject$self$$,$obj$$61$$)}
function $JSCompiler_StaticMethods_disposeObject$$($JSCompiler_StaticMethods_disposeObject$self$$,$obj$$62$$){if($JSCompiler_StaticMethods_disposeObject$self$$.$disposeObjectFn_$)$JSCompiler_StaticMethods_disposeObject$self$$.$disposeObjectFn_$($obj$$62$$);else if($goog$isObject$$($obj$$62$$))if($goog$isFunction$$($obj$$62$$.$dispose$))$obj$$62$$.$dispose$();else for(var $i$$65$$ in $obj$$62$$)delete $obj$$62$$[$i$$65$$]}
$goog$structs$SimplePool$$.prototype.$disposeInternal$=function $$goog$structs$SimplePool$$$$$disposeInternal$$(){$goog$structs$SimplePool$$.$superClass_$.$disposeInternal$.call(this);for(var $freeQueue$$=this.$freeQueue_$;$freeQueue$$.length;)$JSCompiler_StaticMethods_disposeObject$$(this,$freeQueue$$.pop());delete this.$freeQueue_$};var $goog$userAgent$jscript$DETECTED_HAS_JSCRIPT_$$,$goog$userAgent$jscript$VERSION$$=($goog$userAgent$jscript$DETECTED_HAS_JSCRIPT_$$="ScriptEngine"in $goog$global$$&&$goog$global$$.ScriptEngine()=="JScript")?$goog$global$$.ScriptEngineMajorVersion()+"."+$goog$global$$.ScriptEngineMinorVersion()+"."+$goog$global$$.ScriptEngineBuildVersion():"0";var $goog$events$pools$getObject$$,$goog$events$pools$releaseObject$$,$goog$events$pools$getArray$$,$goog$events$pools$releaseArray$$,$goog$events$pools$getProxy$$,$goog$events$pools$setProxyCallbackFunction$$,$goog$events$pools$releaseProxy$$,$goog$events$pools$getListener$$,$goog$events$pools$releaseListener$$,$goog$events$pools$getEvent$$,$goog$events$pools$releaseEvent$$;
(function(){function $getObject$$(){return{$count_$:0,$remaining_$:0}}function $getArray$$(){return[]}function $getProxy$$(){function $f$$25$$($eventObject$$1_v$$){$eventObject$$1_v$$=$proxyCallbackFunction$$.call($f$$25$$.src,$f$$25$$.key,$eventObject$$1_v$$);if(!$eventObject$$1_v$$)return $eventObject$$1_v$$}return $f$$25$$}function $getListener$$(){return new $goog$events$Listener$$}function $getEvent$$(){return new $goog$events$BrowserEvent$$}var $BAD_GC$$=$goog$userAgent$jscript$DETECTED_HAS_JSCRIPT_$$&&
!($goog$string$compareVersions$$($goog$userAgent$jscript$VERSION$$,"5.7")>=0),$proxyCallbackFunction$$;$goog$events$pools$setProxyCallbackFunction$$=function $$goog$events$pools$setProxyCallbackFunction$$$($cb$$){$proxyCallbackFunction$$=$cb$$};if($BAD_GC$$){$goog$events$pools$getObject$$=function $$goog$events$pools$getObject$$$(){return $JSCompiler_StaticMethods_getObject$$($objectPool$$)};$goog$events$pools$releaseObject$$=function $$goog$events$pools$releaseObject$$$($obj$$63$$){$JSCompiler_StaticMethods_releaseObject$$($objectPool$$,
$obj$$63$$)};$goog$events$pools$getArray$$=function $$goog$events$pools$getArray$$$(){return $JSCompiler_StaticMethods_getObject$$($arrayPool$$)};$goog$events$pools$releaseArray$$=function $$goog$events$pools$releaseArray$$$($obj$$64$$){$JSCompiler_StaticMethods_releaseObject$$($arrayPool$$,$obj$$64$$)};$goog$events$pools$getProxy$$=function $$goog$events$pools$getProxy$$$(){return $JSCompiler_StaticMethods_getObject$$($proxyPool$$)};$goog$events$pools$releaseProxy$$=function $$goog$events$pools$releaseProxy$$$(){$JSCompiler_StaticMethods_releaseObject$$($proxyPool$$,
$getProxy$$())};$goog$events$pools$getListener$$=function $$goog$events$pools$getListener$$$(){return $JSCompiler_StaticMethods_getObject$$($listenerPool$$)};$goog$events$pools$releaseListener$$=function $$goog$events$pools$releaseListener$$$($obj$$66$$){$JSCompiler_StaticMethods_releaseObject$$($listenerPool$$,$obj$$66$$)};$goog$events$pools$getEvent$$=function $$goog$events$pools$getEvent$$$(){return $JSCompiler_StaticMethods_getObject$$($eventPool$$)};$goog$events$pools$releaseEvent$$=function $$goog$events$pools$releaseEvent$$$($obj$$67$$){$JSCompiler_StaticMethods_releaseObject$$($eventPool$$,
$obj$$67$$)};var $objectPool$$=new $goog$structs$SimplePool$$(0,600);$objectPool$$.$createObjectFn_$=$getObject$$;var $arrayPool$$=new $goog$structs$SimplePool$$(0,600);$arrayPool$$.$createObjectFn_$=$getArray$$;var $proxyPool$$=new $goog$structs$SimplePool$$(0,600);$proxyPool$$.$createObjectFn_$=$getProxy$$;var $listenerPool$$=new $goog$structs$SimplePool$$(0,600);$listenerPool$$.$createObjectFn_$=$getListener$$;var $eventPool$$=new $goog$structs$SimplePool$$(0,600);$eventPool$$.$createObjectFn_$=
$getEvent$$}else $goog$events$pools$getObject$$=$getObject$$,$goog$events$pools$releaseObject$$=$goog$nullFunction$$,$goog$events$pools$getArray$$=$getArray$$,$goog$events$pools$releaseArray$$=$goog$nullFunction$$,$goog$events$pools$getProxy$$=$getProxy$$,$goog$events$pools$releaseProxy$$=$goog$nullFunction$$,$goog$events$pools$getListener$$=$getListener$$,$goog$events$pools$releaseListener$$=$goog$nullFunction$$,$goog$events$pools$getEvent$$=$getEvent$$,$goog$events$pools$releaseEvent$$=$goog$nullFunction$$})();var $goog$events$listeners_$$={},$goog$events$listenerTree_$$={},$goog$events$sources_$$={},$goog$events$onStringMap_$$={};
function $goog$events$listen$$($src$$9$$,$type$$54$$,$key$$46_listener$$27$$,$capture$$1_opt_capt$$2$$,$opt_handler$$1$$){if($type$$54$$)if($goog$typeOf$$($type$$54$$)=="array"){for(var $i$$66_proxy$$1$$=0;$i$$66_proxy$$1$$<$type$$54$$.length;$i$$66_proxy$$1$$++)$goog$events$listen$$($src$$9$$,$type$$54$$[$i$$66_proxy$$1$$],$key$$46_listener$$27$$,$capture$$1_opt_capt$$2$$,$opt_handler$$1$$);return $JSCompiler_alias_NULL$$}else{var $capture$$1_opt_capt$$2$$=!!$capture$$1_opt_capt$$2$$,$listenerObj_map$$=
$goog$events$listenerTree_$$;$type$$54$$ in $listenerObj_map$$||($listenerObj_map$$[$type$$54$$]=$goog$events$pools$getObject$$());$listenerObj_map$$=$listenerObj_map$$[$type$$54$$];$capture$$1_opt_capt$$2$$ in $listenerObj_map$$||($listenerObj_map$$[$capture$$1_opt_capt$$2$$]=$goog$events$pools$getObject$$(),$listenerObj_map$$.$count_$++);var $listenerObj_map$$=$listenerObj_map$$[$capture$$1_opt_capt$$2$$],$srcUid$$=$src$$9$$[$goog$UID_PROPERTY_$$]||($src$$9$$[$goog$UID_PROPERTY_$$]=++$goog$uidCounter_$$),
$listenerArray$$;$listenerObj_map$$.$remaining_$++;if($listenerObj_map$$[$srcUid$$]){$listenerArray$$=$listenerObj_map$$[$srcUid$$];for($i$$66_proxy$$1$$=0;$i$$66_proxy$$1$$<$listenerArray$$.length;$i$$66_proxy$$1$$++)if($listenerObj_map$$=$listenerArray$$[$i$$66_proxy$$1$$],$listenerObj_map$$.$listener$==$key$$46_listener$$27$$&&$listenerObj_map$$.$handler$==$opt_handler$$1$$){if($listenerObj_map$$.$removed$)break;return $listenerArray$$[$i$$66_proxy$$1$$].key}}else $listenerArray$$=$listenerObj_map$$[$srcUid$$]=
$goog$events$pools$getArray$$(),$listenerObj_map$$.$count_$++;$i$$66_proxy$$1$$=$goog$events$pools$getProxy$$();$i$$66_proxy$$1$$.src=$src$$9$$;$listenerObj_map$$=$goog$events$pools$getListener$$();$listenerObj_map$$.$init$($key$$46_listener$$27$$,$i$$66_proxy$$1$$,$src$$9$$,$type$$54$$,$capture$$1_opt_capt$$2$$,$opt_handler$$1$$);$key$$46_listener$$27$$=$listenerObj_map$$.key;$i$$66_proxy$$1$$.key=$key$$46_listener$$27$$;$listenerArray$$.push($listenerObj_map$$);$goog$events$listeners_$$[$key$$46_listener$$27$$]=
$listenerObj_map$$;$goog$events$sources_$$[$srcUid$$]||($goog$events$sources_$$[$srcUid$$]=$goog$events$pools$getArray$$());$goog$events$sources_$$[$srcUid$$].push($listenerObj_map$$);$src$$9$$.addEventListener?($src$$9$$==$goog$global$$||!$src$$9$$.$customEvent_$)&&$src$$9$$.addEventListener($type$$54$$,$i$$66_proxy$$1$$,$capture$$1_opt_capt$$2$$):$src$$9$$.attachEvent($type$$54$$ in $goog$events$onStringMap_$$?$goog$events$onStringMap_$$[$type$$54$$]:$goog$events$onStringMap_$$[$type$$54$$]="on"+
$type$$54$$,$i$$66_proxy$$1$$);return $key$$46_listener$$27$$}else $JSCompiler_alias_THROW$$(Error("Invalid event type"))}
function $goog$events$unlistenByKey$$($key$$48$$){if(!$goog$events$listeners_$$[$key$$48$$])return $JSCompiler_alias_FALSE$$;var $listener$$31$$=$goog$events$listeners_$$[$key$$48$$];if($listener$$31$$.$removed$)return $JSCompiler_alias_FALSE$$;var $src$$13_srcUid$$1$$=$listener$$31$$.src,$type$$57$$=$listener$$31$$.type,$listenerArray$$2_proxy$$2$$=$listener$$31$$.$proxy$,$capture$$3$$=$listener$$31$$.capture;$src$$13_srcUid$$1$$.removeEventListener?($src$$13_srcUid$$1$$==$goog$global$$||!$src$$13_srcUid$$1$$.$customEvent_$)&&
$src$$13_srcUid$$1$$.removeEventListener($type$$57$$,$listenerArray$$2_proxy$$2$$,$capture$$3$$):$src$$13_srcUid$$1$$.detachEvent&&$src$$13_srcUid$$1$$.detachEvent($type$$57$$ in $goog$events$onStringMap_$$?$goog$events$onStringMap_$$[$type$$57$$]:$goog$events$onStringMap_$$[$type$$57$$]="on"+$type$$57$$,$listenerArray$$2_proxy$$2$$);$src$$13_srcUid$$1$$=$src$$13_srcUid$$1$$[$goog$UID_PROPERTY_$$]||($src$$13_srcUid$$1$$[$goog$UID_PROPERTY_$$]=++$goog$uidCounter_$$);$listenerArray$$2_proxy$$2$$=$goog$events$listenerTree_$$[$type$$57$$][$capture$$3$$][$src$$13_srcUid$$1$$];
if($goog$events$sources_$$[$src$$13_srcUid$$1$$]){var $sourcesArray$$=$goog$events$sources_$$[$src$$13_srcUid$$1$$],$i$$inline_112$$=$goog$array$indexOf$$($sourcesArray$$,$listener$$31$$);$i$$inline_112$$>=0&&($goog$asserts$assert$$($sourcesArray$$.length!=$JSCompiler_alias_NULL$$),$goog$array$ARRAY_PROTOTYPE_$$.splice.call($sourcesArray$$,$i$$inline_112$$,1));$sourcesArray$$.length==0&&delete $goog$events$sources_$$[$src$$13_srcUid$$1$$]}$listener$$31$$.$removed$=$JSCompiler_alias_TRUE$$;$listenerArray$$2_proxy$$2$$.$needsCleanup_$=
$JSCompiler_alias_TRUE$$;$goog$events$cleanUp_$$($type$$57$$,$capture$$3$$,$src$$13_srcUid$$1$$,$listenerArray$$2_proxy$$2$$);delete $goog$events$listeners_$$[$key$$48$$];return $JSCompiler_alias_TRUE$$}
function $goog$events$cleanUp_$$($type$$58$$,$capture$$4$$,$srcUid$$2$$,$listenerArray$$3$$){if(!$listenerArray$$3$$.$locked_$&&$listenerArray$$3$$.$needsCleanup_$){for(var $oldIndex$$=0,$newIndex$$=0;$oldIndex$$<$listenerArray$$3$$.length;$oldIndex$$++)if($listenerArray$$3$$[$oldIndex$$].$removed$){var $proxy$$3$$=$listenerArray$$3$$[$oldIndex$$].$proxy$;$proxy$$3$$.src=$JSCompiler_alias_NULL$$;$goog$events$pools$releaseProxy$$($proxy$$3$$);$goog$events$pools$releaseListener$$($listenerArray$$3$$[$oldIndex$$])}else $oldIndex$$!=
$newIndex$$&&($listenerArray$$3$$[$newIndex$$]=$listenerArray$$3$$[$oldIndex$$]),$newIndex$$++;$listenerArray$$3$$.length=$newIndex$$;$listenerArray$$3$$.$needsCleanup_$=$JSCompiler_alias_FALSE$$;$newIndex$$==0&&($goog$events$pools$releaseArray$$($listenerArray$$3$$),delete $goog$events$listenerTree_$$[$type$$58$$][$capture$$4$$][$srcUid$$2$$],$goog$events$listenerTree_$$[$type$$58$$][$capture$$4$$].$count_$--,$goog$events$listenerTree_$$[$type$$58$$][$capture$$4$$].$count_$==0&&($goog$events$pools$releaseObject$$($goog$events$listenerTree_$$[$type$$58$$][$capture$$4$$]),
delete $goog$events$listenerTree_$$[$type$$58$$][$capture$$4$$],$goog$events$listenerTree_$$[$type$$58$$].$count_$--),$goog$events$listenerTree_$$[$type$$58$$].$count_$==0&&($goog$events$pools$releaseObject$$($goog$events$listenerTree_$$[$type$$58$$]),delete $goog$events$listenerTree_$$[$type$$58$$]))}}
function $goog$events$fireListeners_$$($listenerArray$$5_map$$4$$,$obj$$72_objUid$$2$$,$type$$64$$,$capture$$9$$,$eventObject$$3$$){var $retval$$=1,$obj$$72_objUid$$2$$=$obj$$72_objUid$$2$$[$goog$UID_PROPERTY_$$]||($obj$$72_objUid$$2$$[$goog$UID_PROPERTY_$$]=++$goog$uidCounter_$$);if($listenerArray$$5_map$$4$$[$obj$$72_objUid$$2$$]){$listenerArray$$5_map$$4$$.$remaining_$--;$listenerArray$$5_map$$4$$=$listenerArray$$5_map$$4$$[$obj$$72_objUid$$2$$];$listenerArray$$5_map$$4$$.$locked_$?$listenerArray$$5_map$$4$$.$locked_$++:
$listenerArray$$5_map$$4$$.$locked_$=1;try{for(var $length$$16$$=$listenerArray$$5_map$$4$$.length,$i$$72$$=0;$i$$72$$<$length$$16$$;$i$$72$$++){var $listener$$37$$=$listenerArray$$5_map$$4$$[$i$$72$$];$listener$$37$$&&!$listener$$37$$.$removed$&&($retval$$&=$goog$events$fireListener$$($listener$$37$$,$eventObject$$3$$)!==$JSCompiler_alias_FALSE$$)}}finally{$listenerArray$$5_map$$4$$.$locked_$--,$goog$events$cleanUp_$$($type$$64$$,$capture$$9$$,$obj$$72_objUid$$2$$,$listenerArray$$5_map$$4$$)}}return Boolean($retval$$)}
function $goog$events$fireListener$$($listener$$38$$,$eventObject$$4$$){var $rv$$14$$=$listener$$38$$.handleEvent($eventObject$$4$$);$listener$$38$$.$callOnce$&&$goog$events$unlistenByKey$$($listener$$38$$.key);return $rv$$14$$}
$goog$events$pools$setProxyCallbackFunction$$(function($key$$50$$,$opt_evt$$){if(!$goog$events$listeners_$$[$key$$50$$])return $JSCompiler_alias_TRUE$$;var $listener$$39$$=$goog$events$listeners_$$[$key$$50$$],$be$$1_type$$66$$=$listener$$39$$.type,$map$$6$$=$goog$events$listenerTree_$$;if(!($be$$1_type$$66$$ in $map$$6$$))return $JSCompiler_alias_TRUE$$;var $map$$6$$=$map$$6$$[$be$$1_type$$66$$],$ieEvent_part$$inline_121_retval$$1$$,$targetsMap$$1$$;$goog$events$requiresSyntheticEventPropagation_$$===
$JSCompiler_alias_VOID$$&&($goog$events$requiresSyntheticEventPropagation_$$=$goog$userAgent$IE$$&&!$goog$global$$.addEventListener);if($goog$events$requiresSyntheticEventPropagation_$$){var $JSCompiler_temp$$5_hasCapture$$2_parts$$inline_119$$;if(!($JSCompiler_temp$$5_hasCapture$$2_parts$$inline_119$$=$opt_evt$$))a:{$JSCompiler_temp$$5_hasCapture$$2_parts$$inline_119$$="window.event".split(".");for(var $cur$$inline_120_hasBubble$$1$$=$goog$global$$;$ieEvent_part$$inline_121_retval$$1$$=$JSCompiler_temp$$5_hasCapture$$2_parts$$inline_119$$.shift();)if($cur$$inline_120_hasBubble$$1$$[$ieEvent_part$$inline_121_retval$$1$$]!=
$JSCompiler_alias_NULL$$)$cur$$inline_120_hasBubble$$1$$=$cur$$inline_120_hasBubble$$1$$[$ieEvent_part$$inline_121_retval$$1$$];else{$JSCompiler_temp$$5_hasCapture$$2_parts$$inline_119$$=$JSCompiler_alias_NULL$$;break a}$JSCompiler_temp$$5_hasCapture$$2_parts$$inline_119$$=$cur$$inline_120_hasBubble$$1$$}$ieEvent_part$$inline_121_retval$$1$$=$JSCompiler_temp$$5_hasCapture$$2_parts$$inline_119$$;$JSCompiler_temp$$5_hasCapture$$2_parts$$inline_119$$=$JSCompiler_alias_TRUE$$ in $map$$6$$;$cur$$inline_120_hasBubble$$1$$=
$JSCompiler_alias_FALSE$$ in $map$$6$$;if($JSCompiler_temp$$5_hasCapture$$2_parts$$inline_119$$){if($ieEvent_part$$inline_121_retval$$1$$.keyCode<0||$ieEvent_part$$inline_121_retval$$1$$.returnValue!=$JSCompiler_alias_VOID$$)return $JSCompiler_alias_TRUE$$;a:{var $evt$$13_useReturnValue$$inline_126$$=$JSCompiler_alias_FALSE$$;if($ieEvent_part$$inline_121_retval$$1$$.keyCode==0)try{$ieEvent_part$$inline_121_retval$$1$$.keyCode=-1;break a}catch($ex$$inline_127$$){$evt$$13_useReturnValue$$inline_126$$=
$JSCompiler_alias_TRUE$$}if($evt$$13_useReturnValue$$inline_126$$||$ieEvent_part$$inline_121_retval$$1$$.returnValue==$JSCompiler_alias_VOID$$)$ieEvent_part$$inline_121_retval$$1$$.returnValue=$JSCompiler_alias_TRUE$$}}$evt$$13_useReturnValue$$inline_126$$=$goog$events$pools$getEvent$$();$evt$$13_useReturnValue$$inline_126$$.$init$($ieEvent_part$$inline_121_retval$$1$$,this);$ieEvent_part$$inline_121_retval$$1$$=$JSCompiler_alias_TRUE$$;try{if($JSCompiler_temp$$5_hasCapture$$2_parts$$inline_119$$){for(var $ancestors$$2$$=
$goog$events$pools$getArray$$(),$parent$$18$$=$evt$$13_useReturnValue$$inline_126$$.currentTarget;$parent$$18$$;$parent$$18$$=$parent$$18$$.parentNode)$ancestors$$2$$.push($parent$$18$$);$targetsMap$$1$$=$map$$6$$[$JSCompiler_alias_TRUE$$];$targetsMap$$1$$.$remaining_$=$targetsMap$$1$$.$count_$;for(var $i$$74$$=$ancestors$$2$$.length-1;!$evt$$13_useReturnValue$$inline_126$$.$propagationStopped_$&&$i$$74$$>=0&&$targetsMap$$1$$.$remaining_$;$i$$74$$--)$evt$$13_useReturnValue$$inline_126$$.currentTarget=
$ancestors$$2$$[$i$$74$$],$ieEvent_part$$inline_121_retval$$1$$&=$goog$events$fireListeners_$$($targetsMap$$1$$,$ancestors$$2$$[$i$$74$$],$be$$1_type$$66$$,$JSCompiler_alias_TRUE$$,$evt$$13_useReturnValue$$inline_126$$);if($cur$$inline_120_hasBubble$$1$$){$targetsMap$$1$$=$map$$6$$[$JSCompiler_alias_FALSE$$];$targetsMap$$1$$.$remaining_$=$targetsMap$$1$$.$count_$;for($i$$74$$=0;!$evt$$13_useReturnValue$$inline_126$$.$propagationStopped_$&&$i$$74$$<$ancestors$$2$$.length&&$targetsMap$$1$$.$remaining_$;$i$$74$$++)$evt$$13_useReturnValue$$inline_126$$.currentTarget=
$ancestors$$2$$[$i$$74$$],$ieEvent_part$$inline_121_retval$$1$$&=$goog$events$fireListeners_$$($targetsMap$$1$$,$ancestors$$2$$[$i$$74$$],$be$$1_type$$66$$,$JSCompiler_alias_FALSE$$,$evt$$13_useReturnValue$$inline_126$$)}}else $ieEvent_part$$inline_121_retval$$1$$=$goog$events$fireListener$$($listener$$39$$,$evt$$13_useReturnValue$$inline_126$$)}finally{if($ancestors$$2$$)$ancestors$$2$$.length=0,$goog$events$pools$releaseArray$$($ancestors$$2$$);$evt$$13_useReturnValue$$inline_126$$.$dispose$();
$goog$events$pools$releaseEvent$$($evt$$13_useReturnValue$$inline_126$$)}return $ieEvent_part$$inline_121_retval$$1$$}$be$$1_type$$66$$=new $goog$events$BrowserEvent$$($opt_evt$$,this);try{$ieEvent_part$$inline_121_retval$$1$$=$goog$events$fireListener$$($listener$$39$$,$be$$1_type$$66$$)}finally{$be$$1_type$$66$$.$dispose$()}return $ieEvent_part$$inline_121_retval$$1$$});function $goog$events$EventHandler$$($opt_handler$$7$$){this.$handler_$=$opt_handler$$7$$;this.$keys_$=[]}$goog$inherits$$($goog$events$EventHandler$$,$goog$Disposable$$);var $goog$events$EventHandler$typeArray_$$=[];
function $JSCompiler_StaticMethods_listen$$($JSCompiler_StaticMethods_listen$self$$,$src$$17$$,$type$$67$$,$opt_fn$$,$opt_handler$$8$$){$goog$typeOf$$($type$$67$$)!="array"&&($goog$events$EventHandler$typeArray_$$[0]=$type$$67$$,$type$$67$$=$goog$events$EventHandler$typeArray_$$);for(var $i$$75$$=0;$i$$75$$<$type$$67$$.length;$i$$75$$++)$JSCompiler_StaticMethods_listen$self$$.$keys_$.push($goog$events$listen$$($src$$17$$,$type$$67$$[$i$$75$$],$opt_fn$$||$JSCompiler_StaticMethods_listen$self$$,$JSCompiler_alias_FALSE$$,
$opt_handler$$8$$||$JSCompiler_StaticMethods_listen$self$$.$handler_$||$JSCompiler_StaticMethods_listen$self$$))}$goog$events$EventHandler$$.prototype.$disposeInternal$=function $$goog$events$EventHandler$$$$$disposeInternal$$(){$goog$events$EventHandler$$.$superClass_$.$disposeInternal$.call(this);$goog$array$forEach$$(this.$keys_$,$goog$events$unlistenByKey$$);this.$keys_$.length=0};$goog$events$EventHandler$$.prototype.handleEvent=function $$goog$events$EventHandler$$$$handleEvent$(){$JSCompiler_alias_THROW$$(Error("EventHandler.handleEvent not implemented"))};var $goog$Timer$defaultTimerObject$$=$goog$global$$.window;
function $goog$Timer$callOnce$$($listener$$43$$,$opt_delay$$,$opt_handler$$13$$){$goog$isFunction$$($listener$$43$$)?$opt_handler$$13$$&&($listener$$43$$=$goog$bind$$($listener$$43$$,$opt_handler$$13$$)):$listener$$43$$&&typeof $listener$$43$$.handleEvent=="function"?$listener$$43$$=$goog$bind$$($listener$$43$$.handleEvent,$listener$$43$$):$JSCompiler_alias_THROW$$(Error("Invalid listener argument"));return $opt_delay$$>2147483647?-1:$goog$Timer$defaultTimerObject$$.setTimeout($listener$$43$$,$opt_delay$$||
0)};function $picnet$ui$filter$SearchEngine$$(){this.$precedences_$={or:1,and:2,not:3}}
function $JSCompiler_StaticMethods_doesTextMatchTokens$$($textToMatch$$,$postFixTokens$$,$exactMatch$$){if(!$postFixTokens$$)return $JSCompiler_alias_TRUE$$;for(var $textToMatch$$=$exactMatch$$?$textToMatch$$:$textToMatch$$.toLowerCase(),$stackResult$$=[],$stackResult1_token$$4$$,$stackResult2$$,$i$$78$$=0;$i$$78$$<$postFixTokens$$.length;$i$$78$$++)$stackResult1_token$$4$$=$postFixTokens$$[$i$$78$$],$stackResult1_token$$4$$!=="and"&&$stackResult1_token$$4$$!=="or"&&$stackResult1_token$$4$$!=="not"?
$stackResult1_token$$4$$.indexOf(">")===0||$stackResult1_token$$4$$.indexOf("<")===0||$stackResult1_token$$4$$.indexOf("=")===0||$stackResult1_token$$4$$.indexOf("!=")===0?$stackResult$$.push($JSCompiler_StaticMethods_doesNumberMatchToken$$($stackResult1_token$$4$$,$textToMatch$$)):$stackResult$$.push($exactMatch$$?$textToMatch$$===$stackResult1_token$$4$$:$textToMatch$$.indexOf($stackResult1_token$$4$$)>=0):$stackResult1_token$$4$$==="and"?($stackResult1_token$$4$$=$stackResult$$.pop(),$stackResult2$$=
$stackResult$$.pop(),$stackResult$$.push($stackResult1_token$$4$$&&$stackResult2$$)):$stackResult1_token$$4$$==="or"?($stackResult1_token$$4$$=$stackResult$$.pop(),$stackResult2$$=$stackResult$$.pop(),$stackResult$$.push($stackResult1_token$$4$$||$stackResult2$$)):$stackResult1_token$$4$$==="not"&&($stackResult1_token$$4$$=$stackResult$$.pop(),$stackResult$$.push(!$stackResult1_token$$4$$));return $stackResult$$.length===1&&$stackResult$$.pop()}
function $JSCompiler_StaticMethods_doesNumberMatchToken$$($token$$5$$,$text$$9$$){var $op_txt$$inline_134$$,$exp$$,$actual$$;$op_txt$$inline_134$$=$text$$9$$;$op_txt$$inline_134$$.charAt(0)==="$"&&($op_txt$$inline_134$$=$op_txt$$inline_134$$.substring(1));$actual$$=parseFloat($op_txt$$inline_134$$);if($token$$5$$.indexOf("=")===0)$op_txt$$inline_134$$="=",$exp$$=parseFloat($token$$5$$.substring(1));else if($token$$5$$.indexOf("!=")===0)$op_txt$$inline_134$$="!=",$exp$$=parseFloat($token$$5$$.substring(2));
else if($token$$5$$.indexOf(">=")===0)$op_txt$$inline_134$$=">=",$exp$$=parseFloat($token$$5$$.substring(2));else if($token$$5$$.indexOf(">")===0)$op_txt$$inline_134$$=">",$exp$$=parseFloat($token$$5$$.substring(1));else if($token$$5$$.indexOf("<=")===0)$op_txt$$inline_134$$="<=",$exp$$=parseFloat($token$$5$$.substring(2));else if($token$$5$$.indexOf("<")===0)$op_txt$$inline_134$$="<",$exp$$=parseFloat($token$$5$$.substring(1));else return $JSCompiler_alias_TRUE$$;switch($op_txt$$inline_134$$){case "!=":return $actual$$!==
$exp$$;case "=":return $actual$$===$exp$$;case ">=":return $actual$$>=$exp$$;case ">":return $actual$$>$exp$$;case "<=":return $actual$$<=$exp$$;case "<":return $actual$$<$exp$$}$JSCompiler_alias_THROW$$(Error("Could not find a number operation: "+$op_txt$$inline_134$$))}
function $JSCompiler_StaticMethods_normaliseTerm$$($tokens$$,$token$$7$$,$term$$){for(var $idx$$1$$=$token$$7$$.indexOf($term$$);$idx$$1$$!==-1;)$idx$$1$$>0&&$tokens$$.push($token$$7$$.substring(0,$idx$$1$$)),$tokens$$.push($term$$),$token$$7$$=$token$$7$$.substring($idx$$1$$+1),$idx$$1$$=$token$$7$$.indexOf($term$$);return $token$$7$$};function $picnet$ui$filter$GenericListFilter$$($filterInput$$,$list$$,$options$$2$$){this.list=$list$$;this.options=$options$$2$$;this.$filterInput$=$filterInput$$;this.$filters$=[this.$filterInput$];this.$eventHandler$=new $goog$events$EventHandler$$(this);this.search=new $picnet$ui$filter$SearchEngine$$;this.$initialiseFilters$()}$goog$inherits$$($picnet$ui$filter$GenericListFilter$$,$goog$Disposable$$);var $picnet$ui$filter$GenericListFilter$filteridx$$=0;$JSCompiler_prototypeAlias$$=$picnet$ui$filter$GenericListFilter$$.prototype;
$JSCompiler_prototypeAlias$$.$initialiseFilters$=function $$JSCompiler_prototypeAlias$$$$initialiseFilters$$(){this.$filterKey$=(this.list.getAttribute("id")||this.list.getAttribute("name")||"")+"_"+ ++$picnet$ui$filter$GenericListFilter$filteridx$$+"_filters";this.$initialiseControlCaches$();$JSCompiler_StaticMethods_registerListenersOnFilters$$(this);var $filterState$$inline_142$$=this.options.enableCookies&&$goog$net$cookies$$.get(this.$filterKey$);if($filterState$$inline_142$$){for(var $filterState$$inline_142$$=
$filterState$$inline_142$$.split("|"),$states$$inline_143$$=[],$i$$inline_144$$=0;$i$$inline_144$$<$filterState$$inline_142$$.length;$i$$inline_144$$++){var $state$$inline_145$$=$filterState$$inline_142$$[$i$$inline_144$$].split(",");$states$$inline_143$$.push(new $picnet$ui$filter$FilterState$$($state$$inline_145$$[0],$state$$inline_145$$[3],parseInt($state$$inline_145$$[1],10),$state$$inline_145$$[2]))}$JSCompiler_StaticMethods_applyFilterStates$$(this,$states$$inline_143$$,$JSCompiler_alias_TRUE$$)}};
function $JSCompiler_StaticMethods_registerListenersOnFilters$$($JSCompiler_StaticMethods_registerListenersOnFilters$self$$){var a;$goog$array$forEach$$($JSCompiler_StaticMethods_registerListenersOnFilters$self$$.$filters$,function($filter$$){$JSCompiler_StaticMethods_listen$$(this.$eventHandler$,$filter$$,$filter$$.getAttribute("type")==="text"?"keyup":"change",this.$onFilterChanged$,this)},$JSCompiler_StaticMethods_registerListenersOnFilters$self$$);if($JSCompiler_StaticMethods_registerListenersOnFilters$self$$.options.clearFiltersControls)for(var $i$$82$$=
0;$i$$82$$<$JSCompiler_StaticMethods_registerListenersOnFilters$self$$.options.clearFiltersControls.length;$i$$82$$++)$JSCompiler_StaticMethods_registerListenersOnFilters$self$$.options.clearFiltersControls[$i$$82$$].length&&($JSCompiler_StaticMethods_registerListenersOnFilters$self$$.options.clearFiltersControls[$i$$82$$]=$JSCompiler_StaticMethods_registerListenersOnFilters$self$$.options.clearFiltersControls[$i$$82$$][0]),$JSCompiler_StaticMethods_listen$$($JSCompiler_StaticMethods_registerListenersOnFilters$self$$.$eventHandler$,
$JSCompiler_StaticMethods_registerListenersOnFilters$self$$.options.clearFiltersControls[$i$$82$$],"click",$JSCompiler_StaticMethods_registerListenersOnFilters$self$$.$clearAllFilters$,$JSCompiler_StaticMethods_registerListenersOnFilters$self$$);if($JSCompiler_StaticMethods_registerListenersOnFilters$self$$.options.additionalFilterTriggers)for($i$$82$$=0;$i$$82$$<$JSCompiler_StaticMethods_registerListenersOnFilters$self$$.options.additionalFilterTriggers.length;$i$$82$$++){var $trigger$$=$JSCompiler_StaticMethods_registerListenersOnFilters$self$$.options.additionalFilterTriggers[$i$$82$$];
$trigger$$.length&&(a=$JSCompiler_StaticMethods_registerListenersOnFilters$self$$.options.additionalFilterTriggers[$i$$82$$]=$trigger$$[0],$trigger$$=a);var $type$$72$$=$trigger$$.options?"select-one":$trigger$$.getAttribute("type");switch($type$$72$$){case "select-one":$JSCompiler_StaticMethods_listen$$($JSCompiler_StaticMethods_registerListenersOnFilters$self$$.$eventHandler$,$trigger$$,"change",$JSCompiler_StaticMethods_registerListenersOnFilters$self$$.$onFilterChanged$,$JSCompiler_StaticMethods_registerListenersOnFilters$self$$);
break;case "text":$trigger$$.setAttribute("title",$JSCompiler_StaticMethods_registerListenersOnFilters$self$$.options.filterToolTipMessage);$JSCompiler_StaticMethods_listen$$($JSCompiler_StaticMethods_registerListenersOnFilters$self$$.$eventHandler$,$trigger$$,"keyup",$JSCompiler_StaticMethods_registerListenersOnFilters$self$$.$onFilterChanged$,$JSCompiler_StaticMethods_registerListenersOnFilters$self$$);break;case "checkbox":$JSCompiler_StaticMethods_listen$$($JSCompiler_StaticMethods_registerListenersOnFilters$self$$.$eventHandler$,
$trigger$$,"click",$JSCompiler_StaticMethods_registerListenersOnFilters$self$$.$onFilterChanged$,$JSCompiler_StaticMethods_registerListenersOnFilters$self$$);break;default:$JSCompiler_alias_THROW$$("Filter type "+$type$$72$$+" is not supported")}}}
$JSCompiler_prototypeAlias$$.$clearAllFilters$=function $$JSCompiler_prototypeAlias$$$$clearAllFilters$$(){$goog$array$forEach$$(this.$filters$,this.$clearFilterValue$,this);this.options.additionalFilterTriggers&&$goog$array$forEach$$(this.options.additionalFilterTriggers,this.$clearFilterValue$,this);this.refresh()};
$JSCompiler_prototypeAlias$$.$clearFilterValue$=function $$JSCompiler_prototypeAlias$$$$clearFilterValue$$($f$$26$$){var $type$$73$$=$f$$26$$.options?"select-one":$f$$26$$.getAttribute("type");switch($type$$73$$){case "select-one":$f$$26$$.selectedIndex=0;break;case "text":$f$$26$$.value="";break;case "checkbox":$f$$26$$.checked=$JSCompiler_alias_FALSE$$;break;default:$JSCompiler_alias_THROW$$("Filter type "+$type$$73$$+" is not supported")}};
$JSCompiler_prototypeAlias$$.$initialiseControlCaches$=function $$JSCompiler_prototypeAlias$$$$initialiseControlCaches$$(){this.$listItems$=this.list.childNodes};$JSCompiler_prototypeAlias$$.$onFilterChanged$=function $$JSCompiler_prototypeAlias$$$$onFilterChanged$$(){this.$lastkeytime$=(new Date).getTime();this.$quickFindTimer$()};
$JSCompiler_prototypeAlias$$.$quickFindTimer$=function $$JSCompiler_prototypeAlias$$$$quickFindTimer$$(){if(this.$lastTimerID$)clearTimeout(this.$lastTimerID$),this.$lastTimerID$=0;this.$cancelQuickFind$=$JSCompiler_alias_TRUE$$;var $delay$$3$$=this.options.filterDelay;(new Date).getTime()-this.$lastkeytime$>=$delay$$3$$?this.refresh():this.$lastTimerID$=$goog$Timer$callOnce$$(function(){this.$quickFindTimer$.call(this)},$delay$$3$$/3,this)};
$JSCompiler_prototypeAlias$$.refresh=function $$JSCompiler_prototypeAlias$$$refresh$(){this.$cancelQuickFind$=$JSCompiler_alias_FALSE$$;clearTimeout(this.$lastTimerID$);var $filterStates$$=this.$getFilterStates$();$JSCompiler_StaticMethods_applyFilterStates$$(this,$filterStates$$,$JSCompiler_alias_FALSE$$);if(this.options.enableCookies){for(var $val$$inline_154$$=[],$i$$inline_155$$=0;$i$$inline_155$$<$filterStates$$.length;$i$$inline_155$$++){$val$$inline_154$$.length>0&&$val$$inline_154$$.push("|");
var $state$$inline_156$$=$filterStates$$[$i$$inline_155$$];$val$$inline_154$$.push($state$$inline_156$$.id);$val$$inline_154$$.push(",");$val$$inline_154$$.push($state$$inline_156$$.$idx$);$val$$inline_154$$.push(",");$val$$inline_154$$.push($state$$inline_156$$.type);$val$$inline_154$$.push(",");$val$$inline_154$$.push($state$$inline_156$$.value)}$goog$net$cookies$$.set(this.$filterKey$,$val$$inline_154$$.join(""),999999)}};
$JSCompiler_prototypeAlias$$.$getFilterStates$=function $$JSCompiler_prototypeAlias$$$$getFilterStates$$(){var $state$$1$$=this.$getFilterStateForFilter$(this.$filterInput$);return $state$$1$$?[$state$$1$$]:[]};
$JSCompiler_prototypeAlias$$.$getFilterStateForFilter$=function $$JSCompiler_prototypeAlias$$$$getFilterStateForFilter$$($filter$$1$$){var $type$$74$$=$filter$$1$$.options?"select-one":$filter$$1$$.getAttribute("type"),$value$$67$$;switch($type$$74$$){case "text":$value$$67$$=$filter$$1$$.value===$JSCompiler_alias_NULL$$?$JSCompiler_alias_NULL$$:$filter$$1$$.value.toLowerCase();break;case "select-one":$value$$67$$=$filter$$1$$.selectedIndex===0?$JSCompiler_alias_NULL$$:$filter$$1$$.options[$filter$$1$$.selectedIndex].value;
break;case "checkbox":$value$$67$$=$filter$$1$$.checked;break;default:$JSCompiler_alias_THROW$$("Filter type "+$type$$74$$+" is not supported")}return $value$$67$$===$JSCompiler_alias_NULL$$||$value$$67$$.length<=0?$JSCompiler_alias_NULL$$:new $picnet$ui$filter$FilterState$$($filter$$1$$.getAttribute("id"),$value$$67$$,0,$type$$74$$)};
function $JSCompiler_StaticMethods_applyFilterStates$$($JSCompiler_StaticMethods_applyFilterStates$self$$,$filterStates$$2$$,$setValueOnFilter$$){$JSCompiler_StaticMethods_applyFilterStates$self$$.options.filteringElements&&$JSCompiler_StaticMethods_applyFilterStates$self$$.options.filteringElements($filterStates$$2$$);$JSCompiler_StaticMethods_applyFilterStatesImpl$$($JSCompiler_StaticMethods_applyFilterStates$self$$,$filterStates$$2$$,$setValueOnFilter$$);$JSCompiler_StaticMethods_applyFilterStates$self$$.options.filteredElements&&
$JSCompiler_StaticMethods_applyFilterStates$self$$.options.filteredElements($filterStates$$2$$)}
function $JSCompiler_StaticMethods_applyFilterStatesImpl$$($JSCompiler_StaticMethods_applyFilterStatesImpl$self$$,$filterStates$$3$$,$setValueOnFilter$$1$$){$JSCompiler_StaticMethods_clearElementFilteredStates$$($JSCompiler_StaticMethods_applyFilterStatesImpl$self$$);if(!((!$filterStates$$3$$||$filterStates$$3$$.length)===0&&$JSCompiler_StaticMethods_applyFilterStatesImpl$self$$.options.matchingElement))if($filterStates$$3$$===$JSCompiler_alias_NULL$$||$filterStates$$3$$.length===0)$JSCompiler_StaticMethods_applyStateToElements$$($JSCompiler_StaticMethods_applyFilterStatesImpl$self$$,
$JSCompiler_alias_NULL$$);else for(var $i$$85$$=0;$i$$85$$<$filterStates$$3$$.length;$i$$85$$++){var $state$$3$$=$filterStates$$3$$[$i$$85$$];if($setValueOnFilter$$1$$&&$state$$3$$.type&&$state$$3$$.id){var $filter$$2$$=$goog$isString$$($state$$3$$.id)?document.getElementById($state$$3$$.id):$state$$3$$.id;$filter$$2$$.length===0&&$JSCompiler_alias_THROW$$("Could not find the speficied filter: "+$state$$3$$.id);switch($state$$3$$.type){case "select-one":$goog$array$forEach$$($filter$$2$$.options,
function($o$$1$$,$idx$$2$$){$o$$1$$.value===$state$$3$$.value?($o$$1$$.setAttribute("selected","selected"),$filter$$2$$.selectedIndex=$idx$$2$$):$o$$1$$.removeAttribute("selected")});break;case "text":$filter$$2$$.value=$state$$3$$.value;break;case "checkbox":$filter$$2$$.checked=$state$$3$$.value==="true";break;default:$JSCompiler_alias_THROW$$("Filter type "+$state$$3$$.type+" is not supported")}}$JSCompiler_StaticMethods_applyStateToElements$$($JSCompiler_StaticMethods_applyFilterStatesImpl$self$$,
$state$$3$$)}$JSCompiler_StaticMethods_hideElementsThatDoNotMatchAnyFiltres$$($JSCompiler_StaticMethods_applyFilterStatesImpl$self$$)}function $JSCompiler_StaticMethods_clearElementFilteredStates$$($JSCompiler_StaticMethods_clearElementFilteredStates$self$$){$goog$array$forEach$$($JSCompiler_StaticMethods_clearElementFilteredStates$self$$.$listItems$,function($r$$){$r$$.removeAttribute("filtermatch")})}
function $JSCompiler_StaticMethods_applyStateToElements$$($JSCompiler_StaticMethods_applyStateToElements$self$$,$filterState$$1$$){var $normalisedTokens$$3$$=$JSCompiler_StaticMethods_getNormalisedSearchTokensForState$$($JSCompiler_StaticMethods_applyStateToElements$self$$,$filterState$$1$$);if($normalisedTokens$$3$$)for(var $i$$86$$=0;$i$$86$$<$JSCompiler_StaticMethods_applyStateToElements$self$$.$listItems$.length;$i$$86$$++){if($JSCompiler_StaticMethods_applyStateToElements$self$$.$cancelQuickFind$)break;
var $item$$=$JSCompiler_StaticMethods_applyStateToElements$self$$.$listItems$[$i$$86$$];$item$$.getAttribute("filtermatch")||$JSCompiler_StaticMethods_applyStateToElements$self$$.$doesElementContainText$($filterState$$1$$,$item$$,$normalisedTokens$$3$$)||$item$$.setAttribute("filtermatch","false")}}
function $JSCompiler_StaticMethods_getNormalisedSearchTokensForState$$($JSCompiler_StaticMethods_getNormalisedSearchTokensForState$self$$,$state$$4$$){if($state$$4$$===$JSCompiler_alias_NULL$$)return $JSCompiler_alias_NULL$$;switch($state$$4$$.type){case "select-one":return[$state$$4$$.value];case "text":var $JSCompiler_StaticMethods_parseSearchTokens$self$$inline_162_JSCompiler_inline_result$$158$$;$JSCompiler_StaticMethods_parseSearchTokens$self$$inline_162_JSCompiler_inline_result$$158$$=$JSCompiler_StaticMethods_getNormalisedSearchTokensForState$self$$.search;
var $matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$=$state$$4$$.value;if($matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$){var $matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$=$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$.toLowerCase(),$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$;$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$=
$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$.replace(">= ",">=").replace("> ",">").replace("<= ","<=").replace("< ","<").replace("!= ","!=").replace("= ","=");for(var $i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$=/([^"^\s]+)\s*|"([^"]+)"\s*/g,$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$=[],$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$=$JSCompiler_alias_NULL$$;$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$=
$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$.exec($exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$);)$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$.push($i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$[1]||$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$[2]);$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$=[];
for($i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$=0;$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$<$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$.length;$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$++)$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$=$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$[$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$],
$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$=$JSCompiler_StaticMethods_normaliseTerm$$($exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$,$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$,"("),$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$=$JSCompiler_StaticMethods_normaliseTerm$$($exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$,$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$,
")"),$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$.length>0&&$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.push($i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$);$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$=$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$;$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$=
[];for(var $lastToken$$inline_250_normalisedTokens$$inline_263$$,$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$=0;$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$<$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$.length;$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$++)if(($i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$=$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$[$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$])&&
$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$.length!==0)$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$.indexOf("-")===0&&($i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$="not",$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$[$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$]=$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$[$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$].substring(1),
$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$--),$lastToken$$inline_250_normalisedTokens$$inline_263$$&&$lastToken$$inline_250_normalisedTokens$$inline_263$$!=="("&&$lastToken$$inline_250_normalisedTokens$$inline_263$$!=="not"&&$lastToken$$inline_250_normalisedTokens$$inline_263$$!=="and"&&$lastToken$$inline_250_normalisedTokens$$inline_263$$!=="or"&&$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$!=="and"&&$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$!==
"or"&&$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$!==")"&&$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.push("and"),$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.push($i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$),$lastToken$$inline_250_normalisedTokens$$inline_263$$=$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$;$lastToken$$inline_250_normalisedTokens$$inline_263$$=
$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$;$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$="";$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$=[];for($i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$=0;$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$<$lastToken$$inline_250_normalisedTokens$$inline_263$$.length;$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$++){var $token$$inline_268$$=
$lastToken$$inline_250_normalisedTokens$$inline_263$$[$i$$inline_267_match$$inline_286_token$$inline_241_token$$inline_252$$];if($token$$inline_268$$.length!==0)if($token$$inline_268$$!=="and"&&$token$$inline_268$$!=="or"&&$token$$inline_268$$!=="not"&&$token$$inline_268$$!=="("&&$token$$inline_268$$!==")")$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$=$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$+"|"+$token$$inline_268$$;else if($exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.length===
0||$token$$inline_268$$==="(")$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.push($token$$inline_268$$);else if($token$$inline_268$$===")")for($i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$=$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.pop();$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$!=="("&&$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.length>
0;)$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$=$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$+"|"+$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$,$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$=$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.pop();else{if($exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$[$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.length-
1]!=="(")for(;$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.length!==0;){if($exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$[$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.length-1]==="(")break;if($JSCompiler_StaticMethods_parseSearchTokens$self$$inline_162_JSCompiler_inline_result$$158$$.$precedences_$[$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$[$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.length-
1]]>$JSCompiler_StaticMethods_parseSearchTokens$self$$inline_162_JSCompiler_inline_result$$158$$.$precedences_$[$token$$inline_268$$])$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$=$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.pop(),$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$=$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$+"|"+$i$$inline_240_i$$inline_251_regex$$inline_284_stackOperator$$inline_266$$;
else break}$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.push($token$$inline_268$$)}}for(;$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.length>0;)$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$=$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$+"|"+$exp$$inline_283_newTokens$$inline_249_normalisedTokens$$inline_239_stackOps$$inline_265$$.pop();$JSCompiler_StaticMethods_parseSearchTokens$self$$inline_162_JSCompiler_inline_result$$158$$=
$matches$$inline_285_postFix$$inline_264_text$$inline_163_tokens$$inline_248$$.substring(1).split("|")}else $JSCompiler_StaticMethods_parseSearchTokens$self$$inline_162_JSCompiler_inline_result$$158$$=$JSCompiler_alias_NULL$$;return $JSCompiler_StaticMethods_parseSearchTokens$self$$inline_162_JSCompiler_inline_result$$158$$;case "checkbox":return $JSCompiler_alias_NULL$$;default:$JSCompiler_alias_THROW$$("State type "+$state$$4$$.type+" is not supported")}}
function $JSCompiler_StaticMethods_hideElementsThatDoNotMatchAnyFiltres$$($JSCompiler_StaticMethods_hideElementsThatDoNotMatchAnyFiltres$self$$){for(var $i$$87$$=0;$i$$87$$<$JSCompiler_StaticMethods_hideElementsThatDoNotMatchAnyFiltres$self$$.$listItems$.length;$i$$87$$++){if($JSCompiler_StaticMethods_hideElementsThatDoNotMatchAnyFiltres$self$$.$cancelQuickFind$)break;var $item$$1$$=$JSCompiler_StaticMethods_hideElementsThatDoNotMatchAnyFiltres$self$$.$listItems$[$i$$87$$],$show$$=$item$$1$$.getAttribute("filtermatch")!==
"false";$item$$1$$.style.display=$show$$?"":"none"}}
$JSCompiler_prototypeAlias$$.$doesElementContainText$=function $$JSCompiler_prototypeAlias$$$$doesElementContainText$$($state$$5$$,$item$$2$$,$textTokens$$1$$,$optText_text$$inline_275$$){var $JSCompiler_temp$$2_JSCompiler_temp$$217_exact_object$$inline_180$$=$state$$5$$!=$JSCompiler_alias_NULL$$&&$state$$5$$.type==="select-one";$optText_text$$inline_275$$||($optText_text$$inline_275$$=$goog$string$trim$$($goog$dom$getTextContent$$($item$$2$$)));if($JSCompiler_temp$$2_JSCompiler_temp$$217_exact_object$$inline_180$$=
$JSCompiler_StaticMethods_doesTextMatchTokens$$($optText_text$$inline_275$$,$textTokens$$1$$,$JSCompiler_temp$$2_JSCompiler_temp$$217_exact_object$$inline_180$$))this.options.matchingElement?($JSCompiler_temp$$2_JSCompiler_temp$$217_exact_object$$inline_180$$=$item$$2$$,window.jQuery&&($JSCompiler_temp$$2_JSCompiler_temp$$217_exact_object$$inline_180$$=window.jQuery($item$$2$$)),$JSCompiler_temp$$2_JSCompiler_temp$$217_exact_object$$inline_180$$=this.options.matchingElement($state$$5$$,$JSCompiler_temp$$2_JSCompiler_temp$$217_exact_object$$inline_180$$,
$textTokens$$1$$)):$JSCompiler_temp$$2_JSCompiler_temp$$217_exact_object$$inline_180$$=$JSCompiler_alias_TRUE$$;return $JSCompiler_temp$$2_JSCompiler_temp$$217_exact_object$$inline_180$$};
$JSCompiler_prototypeAlias$$.$disposeInternal$=function $$JSCompiler_prototypeAlias$$$$disposeInternal$$(){$picnet$ui$filter$GenericListFilter$$.$superClass_$.$disposeInternal$.call(this);$goog$dispose$$(this.options);$goog$dispose$$(this.$eventHandler$);$goog$dispose$$(this.search);delete this.list;delete this.$filterInput$;delete this.$listItems$;delete this.$filters$};function $picnet$ui$filter$TableFilter$$($grid$$,$options$$3$$){$options$$3$$.matchingRow&&($options$$3$$.matchingElement=$options$$3$$.matchingRow);$options$$3$$.filteringRows&&($options$$3$$.filteringElements=$options$$3$$.filteringRows);$options$$3$$.filteredRows&&($options$$3$$.filteredElements=$options$$3$$.filteredRows);$picnet$ui$filter$GenericListFilter$$.call(this,$JSCompiler_alias_NULL$$,$grid$$,$options$$3$$)}$goog$inherits$$($picnet$ui$filter$TableFilter$$,$picnet$ui$filter$GenericListFilter$$);
$JSCompiler_prototypeAlias$$=$picnet$ui$filter$TableFilter$$.prototype;$JSCompiler_prototypeAlias$$.$initialiseFilters$=function $$JSCompiler_prototypeAlias$$$$initialiseFilters$$(){this.$thead$=$goog$dom$getElementsByTagNameAndClass_$$("thead",$JSCompiler_alias_NULL$$,this.options.frozenHeaderTable||this.list)[0];this.$tbody$=$goog$dom$getElementsByTagNameAndClass_$$("tbody",$JSCompiler_alias_NULL$$,this.list)[0];$picnet$ui$filter$TableFilter$$.$superClass_$.$initialiseFilters$.call(this)};
$JSCompiler_prototypeAlias$$.$initialiseControlCaches$=function $$JSCompiler_prototypeAlias$$$$initialiseControlCaches$$(){this.headers=$goog$dom$getElementsByTagNameAndClass_$$("th",$JSCompiler_alias_NULL$$,this.$thead$);this.$listItems$=$goog$dom$getElementsByTagNameAndClass_$$("tr",$JSCompiler_alias_NULL$$,this.$tbody$);$JSCompiler_StaticMethods_buildFiltersRow$$(this);var $tHeadFilters$$=$goog$dom$getElementsByTagNameAndClass_$$("tr","filters",this.$thead$)[0];this.$filters$=$goog$array$concat$$($goog$array$map$$($goog$dom$getElementsByTagNameAndClass_$$("input",
$JSCompiler_alias_NULL$$,$tHeadFilters$$),function($ctl$$){return $ctl$$}),$goog$array$map$$($goog$dom$getElementsByTagNameAndClass_$$("select",$JSCompiler_alias_NULL$$,$tHeadFilters$$),function($ctl$$1$$){return $ctl$$1$$}));this.$filterColumnIndexes$=$goog$array$map$$(this.$filters$,this.$getColumnIndexOfFilter$,this)};
$JSCompiler_prototypeAlias$$.$getColumnIndexOfFilter$=function $$JSCompiler_prototypeAlias$$$$getColumnIndexOfFilter$$($f$$27_td$$){var $f$$27_td$$=$goog$dom$getAncestorByTagNameAndClass$$($f$$27_td$$,"TD"),$cells$$=$goog$dom$getAncestorByTagNameAndClass$$($f$$27_td$$,"TR").getElementsByTagName("td");return $goog$array$indexOf$$($cells$$,$f$$27_td$$)};
function $JSCompiler_StaticMethods_buildFiltersRow$$($JSCompiler_StaticMethods_buildFiltersRow$self$$){for(var $tr$$1$$=$goog$dom$createDom$$("tr",{"class":"filters"}),$i$$88$$=0;$i$$88$$<$JSCompiler_StaticMethods_buildFiltersRow$self$$.headers.length;$i$$88$$++){var $element$$inline_192_filterType$$inline_189_header$$2_td$$1$$=$JSCompiler_StaticMethods_buildFiltersRow$self$$.headers[$i$$88$$],$filterClass_visible$$=$element$$inline_192_filterType$$inline_189_header$$2_td$$1$$.style.display!="none";
if($filterClass_visible$$){var $JSCompiler_StaticMethods_getFilterDom$self$$inline_186_headerText$$=$element$$inline_192_filterType$$inline_189_header$$2_td$$1$$.getAttribute("filter")==="false"||!$filterClass_visible$$?"":$goog$dom$getTextContent$$($element$$inline_192_filterType$$inline_189_header$$2_td$$1$$),$filterClass_visible$$=$element$$inline_192_filterType$$inline_189_header$$2_td$$1$$.getAttribute("filter-class");if($JSCompiler_StaticMethods_getFilterDom$self$$inline_186_headerText$$&&$JSCompiler_StaticMethods_getFilterDom$self$$inline_186_headerText$$.length>
1){var $filter$$3$$;a:{var $JSCompiler_StaticMethods_getFilterDom$self$$inline_186_headerText$$=$JSCompiler_StaticMethods_buildFiltersRow$self$$,$colIdx$$inline_187$$=$i$$88$$,$element$$inline_192_filterType$$inline_189_header$$2_td$$1$$=$element$$inline_192_filterType$$inline_189_header$$2_td$$1$$.getAttribute("filter-type")||"text";switch($element$$inline_192_filterType$$inline_189_header$$2_td$$1$$){case "text":$filter$$3$$=$goog$dom$createDom$$("input",{type:"text",id:"filter_"+$colIdx$$inline_187$$,
"class":"filter",title:$JSCompiler_StaticMethods_getFilterDom$self$$inline_186_headerText$$.options.filterToolTipMessage});break a;case "ddl":$filter$$3$$=$JSCompiler_StaticMethods_getSelectFilter$$($JSCompiler_StaticMethods_getFilterDom$self$$inline_186_headerText$$,$colIdx$$inline_187$$);break a;default:$JSCompiler_alias_THROW$$("filter-type: "+$element$$inline_192_filterType$$inline_189_header$$2_td$$1$$+" is not supported")}}$element$$inline_192_filterType$$inline_189_header$$2_td$$1$$=$filter$$3$$;
$goog$isString$$("width")?$goog$style$setStyle_$$($element$$inline_192_filterType$$inline_189_header$$2_td$$1$$,"95%","width"):$goog$object$forEach$$("width",$goog$partial$$($goog$style$setStyle_$$,$element$$inline_192_filterType$$inline_189_header$$2_td$$1$$));$element$$inline_192_filterType$$inline_189_header$$2_td$$1$$=$goog$dom$createDom$$("td",$JSCompiler_alias_NULL$$,$filter$$3$$)}else $element$$inline_192_filterType$$inline_189_header$$2_td$$1$$=$goog$dom$createDom$$("td",{},"");$filterClass_visible$$&&
$goog$dom$classes$add$$($element$$inline_192_filterType$$inline_189_header$$2_td$$1$$,$filterClass_visible$$);$tr$$1$$.appendChild($element$$inline_192_filterType$$inline_189_header$$2_td$$1$$)}}$JSCompiler_StaticMethods_buildFiltersRow$self$$.$thead$.appendChild($tr$$1$$)}
function $JSCompiler_StaticMethods_getSelectFilter$$($JSCompiler_StaticMethods_getSelectFilter$self$$,$colIdx$$1$$){var $select$$=$goog$dom$createDom$$("select",{id:"filter_"+$colIdx$$1$$,"class":"filter"},$goog$dom$createDom$$("option",{},$JSCompiler_StaticMethods_getSelectFilter$self$$.options.selectOptionLabel)),$cells$$1$$=$goog$array$map$$($JSCompiler_StaticMethods_getSelectFilter$self$$.$listItems$,function($r$$1$$){return $r$$1$$.cells[$colIdx$$1$$]}),$values$$7$$=[];$goog$array$forEach$$($cells$$1$$,
function($td$$2_txt$$1$$){($td$$2_txt$$1$$=$goog$string$trim$$($goog$dom$getTextContent$$($td$$2_txt$$1$$)))&&!($td$$2_txt$$1$$==="&nbsp;"||$goog$array$indexOf$$($values$$7$$,$td$$2_txt$$1$$)>=0)&&$values$$7$$.push($td$$2_txt$$1$$)});$values$$7$$.sort();$goog$array$forEach$$($values$$7$$,function($child$$inline_207_txt$$2$$){$child$$inline_207_txt$$2$$=$goog$dom$createDom$$("option",{value:$child$$inline_207_txt$$2$$.replace('"',"&#034;")},$child$$inline_207_txt$$2$$);$select$$.appendChild($child$$inline_207_txt$$2$$)});
return $select$$}
$JSCompiler_prototypeAlias$$.$getFilterStates$=function $$JSCompiler_prototypeAlias$$$$getFilterStates$$(){for(var $filterStates$$4$$=[],$i$$89$$=0;$i$$89$$<this.$filters$.length;$i$$89$$++){var $state$$7$$=this.$getFilterStateForFilter$(this.$filters$[$i$$89$$]);$state$$7$$&&$filterStates$$4$$.push($state$$7$$)}if(!this.options.additionalFilterTriggers)return $filterStates$$4$$;for($i$$89$$=0;$i$$89$$<this.options.additionalFilterTriggers.length;$i$$89$$++)($state$$7$$=this.$getFilterStateForFilter$(this.options.additionalFilterTriggers[$i$$89$$]))&&$filterStates$$4$$.push($state$$7$$);
return $filterStates$$4$$};
$JSCompiler_prototypeAlias$$.$getFilterStateForFilter$=function $$JSCompiler_prototypeAlias$$$$getFilterStateForFilter$$($JSCompiler_inline_result$$209_filter$$4_filterCell$$inline_214$$){var $state$$8$$=$picnet$ui$filter$TableFilter$$.$superClass_$.$getFilterStateForFilter$.call(this,$JSCompiler_inline_result$$209_filter$$4_filterCell$$inline_214$$);if($state$$8$$){$JSCompiler_inline_result$$209_filter$$4_filterCell$$inline_214$$=$goog$dom$getAncestorByTagNameAndClass$$($JSCompiler_inline_result$$209_filter$$4_filterCell$$inline_214$$,"TD");
if(!$JSCompiler_inline_result$$209_filter$$4_filterCell$$inline_214$$||$JSCompiler_inline_result$$209_filter$$4_filterCell$$inline_214$$.length<=0)$JSCompiler_inline_result$$209_filter$$4_filterCell$$inline_214$$=-1;else var $filterRow$$inline_215$$=$goog$dom$getAncestorByTagNameAndClass$$($JSCompiler_inline_result$$209_filter$$4_filterCell$$inline_214$$,"TR"),$JSCompiler_inline_result$$209_filter$$4_filterCell$$inline_214$$=$goog$array$indexOf$$($filterRow$$inline_215$$.cells,$JSCompiler_inline_result$$209_filter$$4_filterCell$$inline_214$$);
$state$$8$$.$idx$=$JSCompiler_inline_result$$209_filter$$4_filterCell$$inline_214$$}return $state$$8$$};
$JSCompiler_prototypeAlias$$.$doesElementContainText$=function $$JSCompiler_prototypeAlias$$$$doesElementContainText$$($state$$9$$,$tr$$2$$,$textTokens$$5$$){var $cells$$2$$=$tr$$2$$.getElementsByTagName("td"),$columnIdx_txt$$3$$=$state$$9$$===$JSCompiler_alias_NULL$$?-1:$state$$9$$.$idx$;if($columnIdx_txt$$3$$<0){for(var $columnIdx_txt$$3$$=[],$i$$90$$=0;$i$$90$$<$cells$$2$$.length;$i$$90$$++){var $header$$5$$=this.headers[$i$$90$$];$header$$5$$.style.display!="none"&&$header$$5$$.getAttribute("filter")!==
"false"&&$columnIdx_txt$$3$$.push($goog$string$trim$$($goog$dom$getTextContent$$($cells$$2$$[$i$$90$$])))}return $picnet$ui$filter$TableFilter$$.$superClass_$.$doesElementContainText$.call(this,$state$$9$$,$tr$$2$$,$textTokens$$5$$,$columnIdx_txt$$3$$.join("\t"))}else return $picnet$ui$filter$TableFilter$$.$superClass_$.$doesElementContainText$.call(this,$state$$9$$,$cells$$2$$[$columnIdx_txt$$3$$],$textTokens$$5$$)};
$JSCompiler_prototypeAlias$$.$disposeInternal$=function $$JSCompiler_prototypeAlias$$$$disposeInternal$$(){$picnet$ui$filter$TableFilter$$.$superClass_$.$disposeInternal$.call(this);delete this.$filterColumnIndexes$;delete this.headers;delete this.$thead$;delete this.$tbody$};var $jq$$=window.jQuery;
$jq$$&&function($jq$$1$$){$jq$$1$$.$tableFilter$=function $$jq$$1$$$$tableFilter$$($element$$65$$,$opts$$){var $tf$$;this.$init$=function $this$$init$$(){var $options$$4$$=$jq$$1$$.extend({},new $picnet$ui$filter$TableFilterOptions$$,$opts$$);$tf$$=new $picnet$ui$filter$TableFilter$$($element$$65$$,$options$$4$$)};this.refresh=function $this$refresh$(){$picnet$ui$filter$TableFilter$$.$superClass_$.refresh.call($tf$$)};this.$init$()};$jq$$1$$.fn.tableFilter=function $$jq$$1$$$fn$tableFilter$($options$$5$$){return $goog$array$forEach$$(this,function($t$$){if($JSCompiler_alias_VOID$$===
$jq$$1$$($t$$).data("tableFilter")||$jq$$1$$($t$$).data("tableFilter")===$JSCompiler_alias_NULL$$){var $plugin$$1$$=new $jq$$1$$.$tableFilter$($t$$,$options$$5$$);$jq$$1$$($t$$).data("tableFilter",$plugin$$1$$)}})};$jq$$1$$.fn.tableFilterRefresh=function $$jq$$1$$$fn$tableFilterRefresh$(){return $goog$array$forEach$$(this,function($t$$1$$){$JSCompiler_alias_VOID$$!==$jq$$1$$($t$$1$$).data("tableFilter")&&$jq$$1$$($t$$1$$).data("tableFilter")!==$JSCompiler_alias_NULL$$&&$jq$$1$$($t$$1$$).data("tableFilter").refresh()})}}($jq$$);
/* Offering Left Border Animation Start */
$(document).on("mouseenter", ".offering-hover", function () {
	$(".offering-hover").each(function () {
		$(this).children(".offerings-row").toggleClass('offerings-hover');
	});
	$(this).children(".offerings-row").removeClass('offerings-hover');
});

$(document).on("mouseleave", ".offering-hover", function () {
	$(".offering-hover").each(function () {
		$(this).children(".offerings-row").toggleClass('offerings-hover');
	});
	$(this).children(".offerings-row").removeClass('offerings-hover');
});
/* Offering Left Border Animation End  */ 

/* Offering components first row topspace*/
$("#our_offerings div.row-fluid.offering-hover:nth-child(1)").addClass('mt50');
/* ------------- SCROLL TO TARGET SECTION ---------------*/
	if ($("#rfs").length <= 0) {
		///$("#like-what-you-see").hide();
		//$("ol.rmv-breadcrum").children().css("margin-right","4px");
		//$("ul.social-share").children().css("right","18%");
		$("[href='#rfs']").attr('href', $("#LetsTalkUrl").attr("href"));
		$("#like-what-you-see a").removeClass('scrollto-target');

	} else {
		if ($("#rfs iframe.iframe-height-about").length > 0 || $("#rfs iframe.iframe-height-investors").length > 0) {
			$("[href='#rfs']").attr('href', $("#LetsTalkUrl").attr("href"));
			$("#like-what-you-see a").removeClass('scrollto-target');
		}
	}


	$(".scrollto-target").click(function (e) {
		e.preventDefault();
		$('html, body').animate({
			scrollTop: $($(this).attr('href')).offset().top - 20
		}, 700);
	});
	/* ------------- SCROLL TO TARGET SECTION Pentagon ---------------*/
	$(".scrollto-target-pentagon").click(function (e) {
		e.preventDefault();
		$('html, body').animate({
			scrollTop: $($(this).attr('href')).offset().top - 70
		}, 700);
	});

//RFS Scroll Top for Thankyou Message
window.rfsscrollonthankyou = function () {
	$('html, body').animate({
		scrollTop: $($('#rfs')).offset().top
	}, 700);

};
var screenWidth_all = $(window).width();
if (screenWidth_all > 1024) {
	//alert(screenWidth_all);
} else {
	function modify_breadcrumb_mob() {
		$("li.mega-dropdown > a").attr("href", "javascript:void();");
	}
	$(document).on('click', '.dropdown', function () {
		//e.stopPropagation();
		//alert("asdsadsa");
	});
}
window.requestfor = function(){
  $('html, body').animate({
        scrollTop: $($('#main-text-body')).offset().top
    }, 700); 

};

$(document).ready(function(){
/* ------------- OWL CAROUSEL SYNTAX ---------------*/

	//hero banner Slider
	var hero_slider_length = $("#hero_slider_carousel").find('.item').length;
	//alert(hero_slider_length);		
	$("#hero_slider_carousel").owlCarousel({
		dots: hero_slider_length > 1 ? true : false,
		nav: hero_slider_length > 1 ? false : false,
		touchDrag: hero_slider_length > 1 ? true : false,
		mouseDrag: hero_slider_length > 1 ? true : false,
		loop: hero_slider_length > 1 ? true : false,
		autoplay: hero_slider_length > 1 ? 3000 : false,
		autoplayHoverPause: hero_slider_length > 1 ? true : false,
		responsive: {
			0: {
				items: 1
			},
			600: {
				items: 1
			},
			768: {
				items: 1
			},
			1000: {
				items: 1
			}
		}
	});

});

	//custom_slider_length
	var custom_slider_length = $("#custom_slider_carousel").find('.item').length;
	$("#custom_slider_carousel").owlCarousel({
		touchDrag: custom_slider_length > 1 ? true : false,
		mouseDrag: custom_slider_length > 1 ? true : false,
		loop: custom_slider_length > 1 ? true : false,
		autoplay: custom_slider_length > 1 ? 3000 : false,
		autoplayHoverPause: custom_slider_length > 1 ? true : false,
		responsive: {
			0: {
				items: 1,
				dots: custom_slider_length > 1 ? true : false,
				nav: custom_slider_length > 1 ? false : false
			},
			600: {
				items: 1,
				dots: custom_slider_length > 1 ? true : false,
				nav: custom_slider_length > 1 ? false : false
			},
			768: {
				items: 1,
				dots: custom_slider_length > 1 ? false : false,
				nav: custom_slider_length > 1 ? true : false
			},
			1000: {
				items: 1,
				dots: custom_slider_length > 1 ? false : false,
				nav: custom_slider_length > 1 ? true : false
			}
		}
	});
	
	//custom_slider_length
	var custom_slider_carousel_length = $(".custom_slider_carousel").find('.item').length;
	$(".custom_slider_carousel").owlCarousel({
		touchDrag: custom_slider_carousel_length > 1 ? true : false,
		mouseDrag: custom_slider_carousel_length > 1 ? true : false,
		loop: custom_slider_carousel_length > 1 ? true : false,
		autoplay: custom_slider_carousel_length > 1 ? 3000 : false,
		autoplayHoverPause: custom_slider_carousel_length > 1 ? true : false,
		responsive: {
			0: {
				items: 1,
				dots: custom_slider_carousel_length > 1 ? true : false,
				nav: custom_slider_carousel_length > 1 ? false : false
			},
			600: {
				items: 1,
				dots: custom_slider_carousel_length > 1 ? true : false,
				nav: custom_slider_carousel_length > 1 ? false : false
			},
			768: {
				items: 1,
				dots: custom_slider_carousel_length > 1 ? false : false,
				nav: custom_slider_carousel_length > 1 ? true : false
			},
			1000: {
				items: 1,
				dots: custom_slider_carousel_length > 1 ? false : false,
				nav: custom_slider_carousel_length > 1 ? true : false
			}
		}
	});

	//About Us - Paperboat Slider
	var paper_length = $("#paper-boat").find('.item').length;
	//alert(paper_length);
	$("#paper-boat").owlCarousel({
		dots: paper_length > 1 ? false : false,
		nav: paper_length > 1 ? true : false,
		touchDrag: paper_length > 1 ? true : false,
		mouseDrag: paper_length > 1 ? true : false,
		loop: paper_length > 1 ? true : false,
		responsive: {
			0: {
				items: 1
			},
			600: {
				items: 1
			},
			768: {
				items: 1
			},
			1000: {
				items: 1

			}
		}
	});

	//ATP Second Slider
	var atp_slider_length = $("#atp_slider_carousel").find('.item').length;
	//alert(atp_slider_carousel);		
	$("#atp_slider_carousel").owlCarousel({
		dots: atp_slider_length > 1 ? false : false,
		nav: atp_slider_length > 1 ? true : false,
		touchDrag: atp_slider_length > 1 ? true : false,
		mouseDrag: atp_slider_length > 1 ? true : false,
		loop: atp_slider_length > 1 ? true : false,
		autoplay: atp_slider_length > 1 ? 3000 : false,
		autoplayHoverPause: atp_slider_length > 1 ? true : false,
		responsive: {
			0: {
				items: 1
			},
			600: {
				items: 1
			},
			768: {
				items: 1
			},
			1000: {
				items: 1
			}
		}
	});

	/* index careers - employeespeak slider */
	var employeespeak_slider = $("#employeespeak_slider").find('.item').length;
	$("#employeespeak_slider").owlCarousel({
		dots: employeespeak_slider > 1 ? true : false,
		nav: employeespeak_slider > 1 ? true : false,
		touchDrag: employeespeak_slider > 1 ? true : false,
		mouseDrag: employeespeak_slider > 1 ? true : false,
		loop: employeespeak_slider > 1 ? true : false,
		autoplay: false,
		autoplayTimeout: 3000,
		autoplayHoverPause: true,
		responsive: {
			0: {
				items: 1
			},
			600: {
				items: 1
			},
			768: {
				items: 1
			},
			1000: {
				items: 1
			}
		}
	});

/* do more expand/collapse effect */
	$(document).on('click', '.expandHead', function () {
		var expandID = $(this).data('id');
		$(expandID).fadeIn();
		$(expandID).addClass('expandWrpr').removeClass('contractWrpr');
		$('.closeWrpr').addClass('closeWrprAnim');
	});
	$(document).on('click', '.closeWrpr', function () {
		$('.expandableDiv').removeClass('expandWrpr').addClass('contractWrpr');
		$('.expandableDiv').fadeOut();
		$('.closeWrpr').removeClass('closeWrprAnim');
	});
/*
 2017 Julian Garnier
 Released under the MIT license
*/
var $jscomp={scope:{}};$jscomp.defineProperty="function"==typeof Object.defineProperties?Object.defineProperty:function(e,r,p){if(p.get||p.set)throw new TypeError("ES3 does not support getters and setters.");e!=Array.prototype&&e!=Object.prototype&&(e[r]=p.value)};$jscomp.getGlobal=function(e){return"undefined"!=typeof window&&window===e?e:"undefined"!=typeof global&&null!=global?global:e};$jscomp.global=$jscomp.getGlobal(this);$jscomp.SYMBOL_PREFIX="jscomp_symbol_";
$jscomp.initSymbol=function(){$jscomp.initSymbol=function(){};$jscomp.global.Symbol||($jscomp.global.Symbol=$jscomp.Symbol)};$jscomp.symbolCounter_=0;$jscomp.Symbol=function(e){return $jscomp.SYMBOL_PREFIX+(e||"")+$jscomp.symbolCounter_++};
$jscomp.initSymbolIterator=function(){$jscomp.initSymbol();var e=$jscomp.global.Symbol.iterator;e||(e=$jscomp.global.Symbol.iterator=$jscomp.global.Symbol("iterator"));"function"!=typeof Array.prototype[e]&&$jscomp.defineProperty(Array.prototype,e,{configurable:!0,writable:!0,value:function(){return $jscomp.arrayIterator(this)}});$jscomp.initSymbolIterator=function(){}};$jscomp.arrayIterator=function(e){var r=0;return $jscomp.iteratorPrototype(function(){return r<e.length?{done:!1,value:e[r++]}:{done:!0}})};
$jscomp.iteratorPrototype=function(e){$jscomp.initSymbolIterator();e={next:e};e[$jscomp.global.Symbol.iterator]=function(){return this};return e};$jscomp.array=$jscomp.array||{};$jscomp.iteratorFromArray=function(e,r){$jscomp.initSymbolIterator();e instanceof String&&(e+="");var p=0,m={next:function(){if(p<e.length){var u=p++;return{value:r(u,e[u]),done:!1}}m.next=function(){return{done:!0,value:void 0}};return m.next()}};m[Symbol.iterator]=function(){return m};return m};
$jscomp.polyfill=function(e,r,p,m){if(r){p=$jscomp.global;e=e.split(".");for(m=0;m<e.length-1;m++){var u=e[m];u in p||(p[u]={});p=p[u]}e=e[e.length-1];m=p[e];r=r(m);r!=m&&null!=r&&$jscomp.defineProperty(p,e,{configurable:!0,writable:!0,value:r})}};$jscomp.polyfill("Array.prototype.keys",function(e){return e?e:function(){return $jscomp.iteratorFromArray(this,function(e){return e})}},"es6-impl","es3");var $jscomp$this=this;
(function(e,r){"function"===typeof define&&define.amd?define([],r):"object"===typeof module&&module.exports?module.exports=r():e.anime=r()})(this,function(){function e(a){if(!h.col(a))try{return document.querySelectorAll(a)}catch(c){}}function r(a,c){for(var d=a.length,b=2<=arguments.length?arguments[1]:void 0,f=[],n=0;n<d;n++)if(n in a){var k=a[n];c.call(b,k,n,a)&&f.push(k)}return f}function p(a){return a.reduce(function(a,d){return a.concat(h.arr(d)?p(d):d)},[])}function m(a){if(h.arr(a))return a;
h.str(a)&&(a=e(a)||a);return a instanceof NodeList||a instanceof HTMLCollection?[].slice.call(a):[a]}function u(a,c){return a.some(function(a){return a===c})}function C(a){var c={},d;for(d in a)c[d]=a[d];return c}function D(a,c){var d=C(a),b;for(b in a)d[b]=c.hasOwnProperty(b)?c[b]:a[b];return d}function z(a,c){var d=C(a),b;for(b in c)d[b]=h.und(a[b])?c[b]:a[b];return d}function T(a){a=a.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,function(a,c,d,k){return c+c+d+d+k+k});var c=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(a);
a=parseInt(c[1],16);var d=parseInt(c[2],16),c=parseInt(c[3],16);return"rgba("+a+","+d+","+c+",1)"}function U(a){function c(a,c,b){0>b&&(b+=1);1<b&&--b;return b<1/6?a+6*(c-a)*b:.5>b?c:b<2/3?a+(c-a)*(2/3-b)*6:a}var d=/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(a)||/hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(a);a=parseInt(d[1])/360;var b=parseInt(d[2])/100,f=parseInt(d[3])/100,d=d[4]||1;if(0==b)f=b=a=f;else{var n=.5>f?f*(1+b):f+b-f*b,k=2*f-n,f=c(k,n,a+1/3),b=c(k,n,a);a=c(k,n,a-1/3)}return"rgba("+
255*f+","+255*b+","+255*a+","+d+")"}function y(a){if(a=/([\+\-]?[0-9#\.]+)(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(a))return a[2]}function V(a){if(-1<a.indexOf("translate")||"perspective"===a)return"px";if(-1<a.indexOf("rotate")||-1<a.indexOf("skew"))return"deg"}function I(a,c){return h.fnc(a)?a(c.target,c.id,c.total):a}function E(a,c){if(c in a.style)return getComputedStyle(a).getPropertyValue(c.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase())||"0"}function J(a,c){if(h.dom(a)&&
u(W,c))return"transform";if(h.dom(a)&&(a.getAttribute(c)||h.svg(a)&&a[c]))return"attribute";if(h.dom(a)&&"transform"!==c&&E(a,c))return"css";if(null!=a[c])return"object"}function X(a,c){var d=V(c),d=-1<c.indexOf("scale")?1:0+d;a=a.style.transform;if(!a)return d;for(var b=[],f=[],n=[],k=/(\w+)\((.+?)\)/g;b=k.exec(a);)f.push(b[1]),n.push(b[2]);a=r(n,function(a,b){return f[b]===c});return a.length?a[0]:d}function K(a,c){switch(J(a,c)){case "transform":return X(a,c);case "css":return E(a,c);case "attribute":return a.getAttribute(c)}return a[c]||
0}function L(a,c){var d=/^(\*=|\+=|-=)/.exec(a);if(!d)return a;var b=y(a)||0;c=parseFloat(c);a=parseFloat(a.replace(d[0],""));switch(d[0][0]){case "+":return c+a+b;case "-":return c-a+b;case "*":return c*a+b}}function F(a,c){return Math.sqrt(Math.pow(c.x-a.x,2)+Math.pow(c.y-a.y,2))}function M(a){a=a.points;for(var c=0,d,b=0;b<a.numberOfItems;b++){var f=a.getItem(b);0<b&&(c+=F(d,f));d=f}return c}function N(a){if(a.getTotalLength)return a.getTotalLength();switch(a.tagName.toLowerCase()){case "circle":return 2*
Math.PI*a.getAttribute("r");case "rect":return 2*a.getAttribute("width")+2*a.getAttribute("height");case "line":return F({x:a.getAttribute("x1"),y:a.getAttribute("y1")},{x:a.getAttribute("x2"),y:a.getAttribute("y2")});case "polyline":return M(a);case "polygon":var c=a.points;return M(a)+F(c.getItem(c.numberOfItems-1),c.getItem(0))}}function Y(a,c){function d(b){b=void 0===b?0:b;return a.el.getPointAtLength(1<=c+b?c+b:0)}var b=d(),f=d(-1),n=d(1);switch(a.property){case "x":return b.x;case "y":return b.y;
case "angle":return 180*Math.atan2(n.y-f.y,n.x-f.x)/Math.PI}}function O(a,c){var d=/-?\d*\.?\d+/g,b;b=h.pth(a)?a.totalLength:a;if(h.col(b))if(h.rgb(b)){var f=/rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(b);b=f?"rgba("+f[1]+",1)":b}else b=h.hex(b)?T(b):h.hsl(b)?U(b):void 0;else f=(f=y(b))?b.substr(0,b.length-f.length):b,b=c&&!/\s/g.test(b)?f+c:f;b+="";return{original:b,numbers:b.match(d)?b.match(d).map(Number):[0],strings:h.str(a)||c?b.split(d):[]}}function P(a){a=a?p(h.arr(a)?a.map(m):m(a)):[];return r(a,
function(a,d,b){return b.indexOf(a)===d})}function Z(a){var c=P(a);return c.map(function(a,b){return{target:a,id:b,total:c.length}})}function aa(a,c){var d=C(c);if(h.arr(a)){var b=a.length;2!==b||h.obj(a[0])?h.fnc(c.duration)||(d.duration=c.duration/b):a={value:a}}return m(a).map(function(a,b){b=b?0:c.delay;a=h.obj(a)&&!h.pth(a)?a:{value:a};h.und(a.delay)&&(a.delay=b);return a}).map(function(a){return z(a,d)})}function ba(a,c){var d={},b;for(b in a){var f=I(a[b],c);h.arr(f)&&(f=f.map(function(a){return I(a,
c)}),1===f.length&&(f=f[0]));d[b]=f}d.duration=parseFloat(d.duration);d.delay=parseFloat(d.delay);return d}function ca(a){return h.arr(a)?A.apply(this,a):Q[a]}function da(a,c){var d;return a.tweens.map(function(b){b=ba(b,c);var f=b.value,e=K(c.target,a.name),k=d?d.to.original:e,k=h.arr(f)?f[0]:k,w=L(h.arr(f)?f[1]:f,k),e=y(w)||y(k)||y(e);b.from=O(k,e);b.to=O(w,e);b.start=d?d.end:a.offset;b.end=b.start+b.delay+b.duration;b.easing=ca(b.easing);b.elasticity=(1E3-Math.min(Math.max(b.elasticity,1),999))/
1E3;b.isPath=h.pth(f);b.isColor=h.col(b.from.original);b.isColor&&(b.round=1);return d=b})}function ea(a,c){return r(p(a.map(function(a){return c.map(function(b){var c=J(a.target,b.name);if(c){var d=da(b,a);b={type:c,property:b.name,animatable:a,tweens:d,duration:d[d.length-1].end,delay:d[0].delay}}else b=void 0;return b})})),function(a){return!h.und(a)})}function R(a,c,d,b){var f="delay"===a;return c.length?(f?Math.min:Math.max).apply(Math,c.map(function(b){return b[a]})):f?b.delay:d.offset+b.delay+
b.duration}function fa(a){var c=D(ga,a),d=D(S,a),b=Z(a.targets),f=[],e=z(c,d),k;for(k in a)e.hasOwnProperty(k)||"targets"===k||f.push({name:k,offset:e.offset,tweens:aa(a[k],d)});a=ea(b,f);return z(c,{children:[],animatables:b,animations:a,duration:R("duration",a,c,d),delay:R("delay",a,c,d)})}function q(a){function c(){return window.Promise&&new Promise(function(a){return p=a})}function d(a){return g.reversed?g.duration-a:a}function b(a){for(var b=0,c={},d=g.animations,f=d.length;b<f;){var e=d[b],
k=e.animatable,h=e.tweens,n=h.length-1,l=h[n];n&&(l=r(h,function(b){return a<b.end})[0]||l);for(var h=Math.min(Math.max(a-l.start-l.delay,0),l.duration)/l.duration,w=isNaN(h)?1:l.easing(h,l.elasticity),h=l.to.strings,p=l.round,n=[],m=void 0,m=l.to.numbers.length,t=0;t<m;t++){var x=void 0,x=l.to.numbers[t],q=l.from.numbers[t],x=l.isPath?Y(l.value,w*x):q+w*(x-q);p&&(l.isColor&&2<t||(x=Math.round(x*p)/p));n.push(x)}if(l=h.length)for(m=h[0],w=0;w<l;w++)p=h[w+1],t=n[w],isNaN(t)||(m=p?m+(t+p):m+(t+" "));
else m=n[0];ha[e.type](k.target,e.property,m,c,k.id);e.currentValue=m;b++}if(b=Object.keys(c).length)for(d=0;d<b;d++)H||(H=E(document.body,"transform")?"transform":"-webkit-transform"),g.animatables[d].target.style[H]=c[d].join(" ");g.currentTime=a;g.progress=a/g.duration*100}function f(a){if(g[a])g[a](g)}function e(){g.remaining&&!0!==g.remaining&&g.remaining--}function k(a){var k=g.duration,n=g.offset,w=n+g.delay,r=g.currentTime,x=g.reversed,q=d(a);if(g.children.length){var u=g.children,v=u.length;
if(q>=g.currentTime)for(var G=0;G<v;G++)u[G].seek(q);else for(;v--;)u[v].seek(q)}if(q>=w||!k)g.began||(g.began=!0,f("begin")),f("run");if(q>n&&q<k)b(q);else if(q<=n&&0!==r&&(b(0),x&&e()),q>=k&&r!==k||!k)b(k),x||e();f("update");a>=k&&(g.remaining?(t=h,"alternate"===g.direction&&(g.reversed=!g.reversed)):(g.pause(),g.completed||(g.completed=!0,f("complete"),"Promise"in window&&(p(),m=c()))),l=0)}a=void 0===a?{}:a;var h,t,l=0,p=null,m=c(),g=fa(a);g.reset=function(){var a=g.direction,c=g.loop;g.currentTime=
0;g.progress=0;g.paused=!0;g.began=!1;g.completed=!1;g.reversed="reverse"===a;g.remaining="alternate"===a&&1===c?2:c;b(0);for(a=g.children.length;a--;)g.children[a].reset()};g.tick=function(a){h=a;t||(t=h);k((l+h-t)*q.speed)};g.seek=function(a){k(d(a))};g.pause=function(){var a=v.indexOf(g);-1<a&&v.splice(a,1);g.paused=!0};g.play=function(){g.paused&&(g.paused=!1,t=0,l=d(g.currentTime),v.push(g),B||ia())};g.reverse=function(){g.reversed=!g.reversed;t=0;l=d(g.currentTime)};g.restart=function(){g.pause();
g.reset();g.play()};g.finished=m;g.reset();g.autoplay&&g.play();return g}var ga={update:void 0,begin:void 0,run:void 0,complete:void 0,loop:1,direction:"normal",autoplay:!0,offset:0},S={duration:1E3,delay:0,easing:"easeOutElastic",elasticity:500,round:0},W="translateX translateY translateZ rotate rotateX rotateY rotateZ scale scaleX scaleY scaleZ skewX skewY perspective".split(" "),H,h={arr:function(a){return Array.isArray(a)},obj:function(a){return-1<Object.prototype.toString.call(a).indexOf("Object")},
pth:function(a){return h.obj(a)&&a.hasOwnProperty("totalLength")},svg:function(a){return a instanceof SVGElement},dom:function(a){return a.nodeType||h.svg(a)},str:function(a){return"string"===typeof a},fnc:function(a){return"function"===typeof a},und:function(a){return"undefined"===typeof a},hex:function(a){return/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a)},rgb:function(a){return/^rgb/.test(a)},hsl:function(a){return/^hsl/.test(a)},col:function(a){return h.hex(a)||h.rgb(a)||h.hsl(a)}},A=function(){function a(a,
d,b){return(((1-3*b+3*d)*a+(3*b-6*d))*a+3*d)*a}return function(c,d,b,f){if(0<=c&&1>=c&&0<=b&&1>=b){var e=new Float32Array(11);if(c!==d||b!==f)for(var k=0;11>k;++k)e[k]=a(.1*k,c,b);return function(k){if(c===d&&b===f)return k;if(0===k)return 0;if(1===k)return 1;for(var h=0,l=1;10!==l&&e[l]<=k;++l)h+=.1;--l;var l=h+(k-e[l])/(e[l+1]-e[l])*.1,n=3*(1-3*b+3*c)*l*l+2*(3*b-6*c)*l+3*c;if(.001<=n){for(h=0;4>h;++h){n=3*(1-3*b+3*c)*l*l+2*(3*b-6*c)*l+3*c;if(0===n)break;var m=a(l,c,b)-k,l=l-m/n}k=l}else if(0===
n)k=l;else{var l=h,h=h+.1,g=0;do m=l+(h-l)/2,n=a(m,c,b)-k,0<n?h=m:l=m;while(1e-7<Math.abs(n)&&10>++g);k=m}return a(k,d,f)}}}}(),Q=function(){function a(a,b){return 0===a||1===a?a:-Math.pow(2,10*(a-1))*Math.sin(2*(a-1-b/(2*Math.PI)*Math.asin(1))*Math.PI/b)}var c="Quad Cubic Quart Quint Sine Expo Circ Back Elastic".split(" "),d={In:[[.55,.085,.68,.53],[.55,.055,.675,.19],[.895,.03,.685,.22],[.755,.05,.855,.06],[.47,0,.745,.715],[.95,.05,.795,.035],[.6,.04,.98,.335],[.6,-.28,.735,.045],a],Out:[[.25,
.46,.45,.94],[.215,.61,.355,1],[.165,.84,.44,1],[.23,1,.32,1],[.39,.575,.565,1],[.19,1,.22,1],[.075,.82,.165,1],[.175,.885,.32,1.275],function(b,c){return 1-a(1-b,c)}],InOut:[[.455,.03,.515,.955],[.645,.045,.355,1],[.77,0,.175,1],[.86,0,.07,1],[.445,.05,.55,.95],[1,0,0,1],[.785,.135,.15,.86],[.68,-.55,.265,1.55],function(b,c){return.5>b?a(2*b,c)/2:1-a(-2*b+2,c)/2}]},b={linear:A(.25,.25,.75,.75)},f={},e;for(e in d)f.type=e,d[f.type].forEach(function(a){return function(d,f){b["ease"+a.type+c[f]]=h.fnc(d)?
d:A.apply($jscomp$this,d)}}(f)),f={type:f.type};return b}(),ha={css:function(a,c,d){return a.style[c]=d},attribute:function(a,c,d){return a.setAttribute(c,d)},object:function(a,c,d){return a[c]=d},transform:function(a,c,d,b,f){b[f]||(b[f]=[]);b[f].push(c+"("+d+")")}},v=[],B=0,ia=function(){function a(){B=requestAnimationFrame(c)}function c(c){var b=v.length;if(b){for(var d=0;d<b;)v[d]&&v[d].tick(c),d++;a()}else cancelAnimationFrame(B),B=0}return a}();q.version="2.2.0";q.speed=1;q.running=v;q.remove=
function(a){a=P(a);for(var c=v.length;c--;)for(var d=v[c],b=d.animations,f=b.length;f--;)u(a,b[f].animatable.target)&&(b.splice(f,1),b.length||d.pause())};q.getValue=K;q.path=function(a,c){var d=h.str(a)?e(a)[0]:a,b=c||100;return function(a){return{el:d,property:a,totalLength:N(d)*(b/100)}}};q.setDashoffset=function(a){var c=N(a);a.setAttribute("stroke-dasharray",c);return c};q.bezier=A;q.easings=Q;q.timeline=function(a){var c=q(a);c.pause();c.duration=0;c.add=function(d){c.children.forEach(function(a){a.began=
!0;a.completed=!0});m(d).forEach(function(b){var d=z(b,D(S,a||{}));d.targets=d.targets||a.targets;b=c.duration;var e=d.offset;d.autoplay=!1;d.direction=c.direction;d.offset=h.und(e)?b:L(e,b);c.began=!0;c.completed=!0;c.seek(d.offset);d=q(d);d.began=!0;d.completed=!0;d.duration>b&&(c.duration=d.duration);c.children.push(d)});c.seek(0);c.reset();c.autoplay&&c.restart();return c};return c};q.random=function(a,c){return Math.floor(Math.random()*(c-a+1))+a};return q});
