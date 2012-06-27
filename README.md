Any-List-Smart-Filter
=====================

jquery plugin to create automatically smart filtering to any list

Usage
=====

1) include Jquery library
2) create a list like this:

<ul id="cars">
  <li class='ListItem'> 
		<span role='filter-make'>fiat</span> 
		<span role='filter-model'>panda</span>
		<span role='filter-year'>2004</span>
	</li>
   <li class='ListItem'> 
	   <span role='filter-make'>ford</span>
	   <span role='filter-model'>focus</span>
	   <span role='filter-year'>2008</span>
   </li>
   <li class='ListItem'> 
	   <span role='filter-make'>lancia</span>
	   <span role='filter-model'>delta</span>
	   <span role='filter-year'>2008</span>
   </li>
 </ul>
 
 3) create a place holder for the filters
    <div id="filtersHere"></div>
 4) run the plugin:
 
 <script>
    $(document).ready(function () {

        //here you set the filter.
        var filtersRules =
            {
                'Make': 'filter-make',
                'Model': 'filter-model',
                'Production Year': 'filter-year'
            };

        var options = {
            filterContainer: $('#filtersHere'),
            Rules: filtersRules,
            itemsChanged: function (container, visibleItems, source) {
                console.log(visibleItems.length + ' filtered cars');
            }
        };


        $('#cars').listAutoFilter(options);
        
  5) that's all

    });
</script>