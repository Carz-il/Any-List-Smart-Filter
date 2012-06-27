/*
* this plugin make filter options for a given list - not limited to tables or ul.
* you should wrap any field you want to be filtered by a tag 
*
* written by yardenst@gmail.com
*/

(function ($) {

	var methods = {
		init: function (options) {

			var defaults = {
				filterFieldsPrefix: 'filter-',
				filterOptionClass: 'filterPropertiesCb',
				maxFilters: 1000,
				rowClass: 'ListItem',
				Rules: null,
				itemsChangedEvent: 'listItemsChange.listAutoFilter',
				itemsChanged: function () {
					//fires when items on the list are changed
				}
			};

			options = $.extend(defaults, options);

			return this.each(function () {


				var listContainer = $(this);
				var filterContainer = $(options.filterContainer);

				//attach event to the list. the event fires when items on the list are changed
				listContainer.bind(options.itemsChangedEvent, function (event, source) {

					var numOfChanges = methods.checkOrUnCheckOtherFilters(listContainer, filterContainer, options, source);
					methods.disableIfHaveTo(filterContainer, options);
					if (numOfChanges == 0) {
						options.itemsChanged(listContainer, methods.visibleItems(listContainer, options), source);
					}

				});

				var howManyFiltersFound = 0;

				//make all filters elements
				for (title in options.Rules) {
					if (howManyFiltersFound == options.maxFilters) {
						break;
					}


					var roleName = options.Rules[title];
					var filterElement = methods.generateFilterOptions(roleName, title, listContainer, options);

					if (filterElement != null) {
						filterElement.appendTo(filterContainer);
						howManyFiltersFound++;
					}
				}


				if (howManyFiltersFound > 0) {

					$("." + options.filterOptionClass).bind("change", function () {

						var $this = $(this);
						methods.filterList(listContainer, options, $this);
						listContainer.trigger(options.itemsChangedEvent, $this);

					});
				} else {
					console.log('No unique filters found for ' + listContainer);
					filterContainer.hide();
				}


			});


		},
		isValueInList: function (value, role, items) {
			/*
			* returns if there is a value (with the given role) in a  list of items
			* TODO: improve performance
			*/
			for (var i = 0; i < items.length; i++) {

				var $listItem = $(items[i]);
				var matchedRole = $listItem.find('[role="' + role + '"]');

				if ($.trim(matchedRole.text()) == $.trim(value)) {
					return true;
				}

			}

			return false;

		},

		disableIfHaveTo: function (filterContainer, options) {
			/*
			* disable filter options if they are the only one that checked in their role list.
			*/
			for (title in options.Rules) {

				var role = options.Rules[title];
				var filterElements = filterContainer.find("." + options.filterOptionClass).filter(function () {
					return $(this).data('role') == role;
				});
				if (!filterElements) {
					return;
				}

				var checkedFilters = filterElements.filter(':checked');

				if (checkedFilters.length == 1) {
					checkedFilters.attr('disabled', 'disabled');
				} else {
					filterElements.removeAttr('disabled');
				}

			}
		},

		checkOrUnCheckOtherFilters: function (listContainer, filterContainer, options) {

			/* 
			* this function will check or uncheck filter checkboxes based on the current list status
			* //TODO: improve performance
			*/

			var filterCheckboxes = filterContainer.find("." + options.filterOptionClass);
			var visibleItems = methods.visibleItems(listContainer, options);
			var numOfCheckboxesChanged = 0;
			filterCheckboxes.each(function () {

				var $this = $(this);
				var wasChecked = $this.is(':checked');
				var wasChanged;
				var role = $this.data('role');
				var value = $this.data('value');

				if (methods.isValueInList(value, role, visibleItems)) {

					$this.attr("checked", true);
					wasChanged = !wasChecked;

				} else {
					$this.attr("checked", false);
					wasChanged = wasChecked;
				}
				if (wasChanged) {
					numOfCheckboxesChanged++;
					$this.trigger("change");

				}
			});
			return numOfCheckboxesChanged;
		},


		getUniqueValues: function (role, container) {
			/*
			* return unique values for a given role in a given container of list items
			*/
			var allValues = [];
			var elements = $('[role="' + role + '"]', container);
			$(elements).each(function () {

				var html = $.trim($(this).html());
				allValues.push(html);

			});
			return allValues.unique().sort();

		},

		generateFilterOptions: function (role, catName, listContainer, options) {


			/*
			* generates filter options for given selector, based on its html values
			* returns element with filter options
			*/
			var filterIndex = 0;
			var values = methods.getUniqueValues(role, listContainer, options);

			if (values.length <= 1) {
				return null;
			}

			var innerContainer = $('<div class="filterBox"><span class="filterTitle">' + catName + '</span></div>');
			var filterOptions = $('<div class="filterOptions"></div>');
			filterOptions.appendTo(innerContainer);
			$(values).each(
				function () {

					filterIndex++;
					var filterOptionId = listContainer.attr("id") + '_' + role + '_' + filterIndex;
					var value = this;
					var optionWrapper = $('<span class="optionWrapper"></span>');
					var optionCb = $('<input type="checkbox" class="' + options.filterOptionClass + '" checked="checked"></input>').attr('id', filterOptionId);
					optionCb.data('value', value);
					optionCb.data('role', role);
					var optionLabel = $('<label>' + value + '</label>');

					optionLabel.attr('for', filterOptionId);

					$(optionCb).appendTo(optionWrapper);
					$(optionLabel).appendTo(optionWrapper);
					$(optionWrapper).appendTo(filterOptions);
				}
			);

			return innerContainer;
		},

		filterList: function (listContainer, options, source) {

			//source = the checkbox made the event

			//loop all list items
			var listItems = listContainer.find('.' + options.rowClass);
			listItems.show();

			listItems.each(function () {

				//for each list item, get a list of roles-values
				var listItem = $(this);
				var rolesValues = listItem.find('[role^=' + options.filterFieldsPrefix + ']');

				var arrFiltersStatuses = [];
				//check if there is a role-value that is not checked
				rolesValues.each(
					function () {
						var roleValueFilter = $(this);
						var role = roleValueFilter.attr('role');
						var value = roleValueFilter.text();
						var isFilterChecked = isAssociatedFilterCheckboxChecked(role, value);

						arrFiltersStatuses.push(isFilterChecked);


					}
				);

				if ($.inArray(false, arrFiltersStatuses) >= 0) {
					listItem.hide();
				}


			});


			function isAssociatedFilterCheckboxChecked(role, value) {
				value = $.trim(value);
				role = $.trim(role);
				var filterCheckbox = $(options.filterContainer).find('*').filter(function () {
					return $(this).data('role') == role;
				}).filter(function () {
					return $(this).data('value') == value;
				});
				if (filterCheckbox.length == 0) {
					return true;
				}
				return filterCheckbox.is(':checked');

			}

			;

			if (source.is(':checked')) {
				//check all the source
				var sourceRole = source.data('role');
				var sourceValue = source.data('value');
				var filterFunc = function () {
					return ($.trim($(this).text()) == sourceValue);
				};

				//get all matched listitems
				var listItemsSource = listContainer.find($('[role="' + sourceRole + '"]').filter(filterFunc).parents("." + options.rowClass));

				listItemsSource.show();
			}
		},

		visibleItems: function (listContainer, options) {

			/*
			* return a list of all visible items in the listContainer
			*/

			var visibleItems = [];

			listContainer.find("." + options.rowClass).each(
				function () {
					if ($(this).is(':visible')) {

						visibleItems.push(this);
					}
				}
			);

			return visibleItems;

		}
	};

	$.fn.extend({
		listAutoFilter: function (method) {

			if (methods[method]) {

				return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));

			} else if (typeof method === 'object' || !method) {

				return methods.init.apply(this, arguments);

			} else {

				$.error('Method ' + method + ' does not exist on jQuery.listAutoFilter');
				return false;
			}


		}
	});

})(jQuery);

Array.prototype.unique = function() {
	var arrVal = this;
	var uniqueArr = [];
	for (var i = arrVal.length; i--;) {
		var val = arrVal[i];
		if ($.inArray(val, uniqueArr) === -1) {
			uniqueArr.unshift(val);
		}
	}
	return uniqueArr;
};