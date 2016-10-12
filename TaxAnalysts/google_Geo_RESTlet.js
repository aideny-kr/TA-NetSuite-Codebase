/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       12 Nov 2015     Chan
 *
 */

/**
 * @param {Object}  Parameter object
 * @returns {Object} Output object
 */
function postRESTlet(datain) {
	
	var obj = new Object();
	var web_data = [['Country', 'Web Subscribers']];
	var cust_data = [['Country', 'Customers']];
	var us_data = [['State', 'Web Subscribers', 'Customers']];
	
	var filters = [];
	filters.push(new nlobjSearchFilter('stage', null, 'is', 'CUSTOMER'));
	filters.push(new nlobjSearchFilter('country', null, 'noneof', '@NONE@'));
	filters.push(new nlobjSearchFilter('internalid', 'CUSTRECORD_CONTRACTUSER_CUSTOMER', 'noneof', '@NONE@'));
	
	var columns = [];
	columns.push(new nlobjSearchColumn('country', null, 'group'));
	columns.push(new nlobjSearchColumn('internalid', 'CUSTRECORD_CONTRACTUSER_CUSTOMER', 'count'));
	
	var search_result = nlapiSearchRecord('customer', null, filters, columns);
	
	if(isNotEmpty(search_result)){
		for(var i = 0; i < search_result.length; i += 1){
			var cols = search_result[i].getAllColumns();
			var country = search_result[i].getText(cols[0].getName(), cols[0].getJoin(), cols[0].getSummary());
			var customer = search_result[i].getValue(cols[1].getName(), cols[1].getJoin(), cols[1].getSummary());
			country = (country == 'Korea, Republic of') ? 'South Korea':country;
			web_data.push([country, parseInt(customer)]);
		}
	}
	
	var cust_search_result = nlapiSearchRecord('customer', 'customsearch__customers_by_country');
	
	if(isNotEmpty(cust_search_result)){
		for(var x = 0; x < cust_search_result.length; x++){
			var cols = cust_search_result[x].getAllColumns();
			var country = cust_search_result[x].getText(cols[0].getName(), cols[0].getJoin(), cols[0].getSummary());
			var customer = cust_search_result[x].getValue(cols[1].getName(), cols[1].getJoin(), cols[1].getSummary());
			country = (country == 'Korea, Republic of') ? 'South Korea':country;
			cust_data.push([country, parseInt(customer)]); 
		}
	}
	
	var us_search_result = nlapiSearchRecord('customer', 'customsearch__customer_by_state');
	
	if(isNotEmpty(us_search_result)){
		for(var y = 0; y < us_search_result.length; y++){
			var cols = us_search_result[y].getAllColumns();
			var state = us_search_result[y].getValue(cols[0].getName(), cols[0].getJoin(), cols[0].getSummary());
			var webuser = us_search_result[y].getValue(cols[1].getName(), cols[1].getJoin(), cols[1].getSummary());
			var customer = us_search_result[y].getValue(cols[2].getName(), cols[2].getJoin(), cols[2].getSummary());
			
			us_data.push([state, parseInt(webuser), parseInt(customer)]);
		}
	}
	
	obj.web = web_data;
	obj.customer = cust_data;
	obj.us_state = us_data;
	
	nlapiLogExecution('DEBUG', 'Data', JSON.stringify(obj));
	return JSON.stringify(obj);
}
