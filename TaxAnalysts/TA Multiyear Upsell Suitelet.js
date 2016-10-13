/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 May 2016     Chan
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

/**
 * Description: This script will merge Up-selling Sales Order to original Multi-year Sales Order.
 * The will result merged invoice for next invoice.   
 */

function mergeMultiyearUpsell(request, response){
	
	var soid = request.getParameter('soid');
	var cust_info = nlapiLookupField('salesorder', soid, ['custbody_contract_name', 'entity']);
	var orig_soid;
	var merge_items = [];
	var FIELDS_TO_COPY = ['item', 'quantity', 'rate', 'price', 'custcol_item_pricing_type', 'custcol_list_rate', 'custcol_renewals_exclusion', 'custcol_swe_contract_end_date', 'custcol_swe_contract_item_term_months', 'custcol_swe_contract_start_date'];
	var VALID_BILL_SCHEDS = ['44', '45', '46', '47'];
	// Searching for the original sales order id (orig_soid)
	var search_filters = [];
	search_filters.push(new nlobjSearchFilter('entity', null, 'is', cust_info.entity));
	search_filters.push(new nlobjSearchFilter('custbody_contract_name', null, 'is', cust_info.custbody_contract_name));
	search_filters.push(new nlobjSearchFilter('custbody_order_type', null, 'anyof', ['1', '2']));
	search_filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	
	var search_column = [ new nlobjSearchColumn('internalid', null, null).setSort(false) ];
	
	var result = nlapiSearchRecord('salesorder', null, search_filters, search_column);
	if(!result) {
		throw "No original contract found."
	}
	orig_soid = result[0].getId();
	nlapiLogExecution('DEBUG', 'Original SO ID', orig_soid);
	
	
	if(orig_soid) {
		var orig_so_rec = nlapiLoadRecord('salesorder', orig_soid);
		sublist_count = orig_so_rec.getLineItemCount('item');
		var valid_billsched_count = 0;
		// Validate Sales Order
		for(var i = 1; i <= sublist_count; i += 1) {
			
			if( VALID_BILL_SCHEDS.indexOf(orig_so_rec.getLineItemValue('item', 'billingschedule', i)) > -1) {
				valid_billsched_count += 1;
			}
		}
		// If orig_so_rec has valid billing schedule...
		if(valid_billsched_count > 0) {
			// Get Values from up-selling SO 
			var upsell_so_rec = nlapiLoadRecord('salesorder', soid);
			var upsell_so_item_count = upsell_so_rec.getLineItemCount('item');
			var upsell_tranid = upsell_so_rec.getFieldValue('tranid');
			var discount = +upsell_so_rec.getFieldValue('discounttotal');
			//iterate each line of upsell_so_rec
			for( var i = 1; i <= upsell_so_item_count; i += 1 ) {
				// Copy the line values if the line has the VALID_BILL_SCHEDS
				if( VALID_BILL_SCHEDS.indexOf( upsell_so_rec.getLineItemValue('item', 'billingschedule', i)) > -1 ) {
					// Build JSON to pass to orig_so_rec
					var item_obj = _.reduce(FIELDS_TO_COPY, function(new_obj, field){
						new_obj[field] = upsell_so_rec.getLineItemValue('item', field, i);	
						new_obj['linenum'] = i;
						new_obj['description'] = 'Additional License(s) from #' + upsell_tranid ;
						return new_obj;
					}, {});
					
					// Merge to Array
					if(item_obj){
						
						// Apply discount to list rate and rate column
						if (discount) {
							var discountRate = 1 - (-discount / +upsell_so_rec.getFieldValue('subtotal'));
							discountRate = discountRate.toFixed(4);
							item_obj['custcol_list_rate'] = +item_obj['custcol_list_rate'] * discountRate;
							item_obj['rate'] = + item_obj['rate'] * discountRate;
						}
						nlapiLogExecution('DEBUG', 'List Rate in upsell', item_obj['custcol_list_rate']);
						merge_items.push(item_obj);
					}
				}
			}
			
			nlapiLogExecution('DEBUG', 'item_obj', JSON.stringify(merge_items));
			
			
			// Merging items
			if(merge_items.length > 0) {
				
				var orig_so_discount = orig_so_rec.getFieldValue('discountrate');
				//var orig_so_total = orig_so_rec.getFieldValue('total');
				
				merge_items.forEach(function(item) {
					
					var billing_sched = findMatchingBillSched(orig_so_rec, item["custcol_swe_contract_end_date"]);
					//nlapiLogExecution('DEBUG', 'Billing Schedule Test', billing_sched);
					
					// resolve discount rate in original contract
					if(orig_so_discount) {
						var newRates = resolveDiscountRate(item['rate'], item['custcol_list_rate'], orig_so_discount);
						if(newRates && newRates.hasOwnProperty('rate') && newRates.hasOwnProperty('list_rate')) {
							item['rate'] = newRates.rate;
							item['custcol_list_rate'] = newRates.list_rate;
						}
					}
					nlapiLogExecution('DEBUG', 'List Rate right before merging', item['custcol_list_rate']);
					orig_so_rec.selectNewLineItem('item');
					
					// Set each column per line
					for( var field in item ){
						if(field == 'linenum') {
							continue;
						}
						
						orig_so_rec.setCurrentLineItemValue('item', field, item[field]);
						orig_so_rec.setCurrentLineItemValue('item', 'billingschedule', billing_sched);
					}
					orig_so_rec.commitLineItem('item');
					
				});
				
				
				
				//submit original SO record
				var submittedRecord;
				try{
					submittedRecord = nlapiSubmitRecord(orig_so_rec, null, true);
				} catch(e) {
					var error = nlapiCreateError('ERROR while submitting Sales Order', e);
					throw error.details;
				}
				
				// Set custbody_ta_multiyear_upsell_merge field to 'T'
				if(submittedRecord) {
					upsell_so_rec.setFieldValue('custbody_ta_multiyear_upsell_merge', 'T');
					// remove lines for merged items 
					removeMergedItems(upsell_so_rec, merge_items);
					nlapiSetRedirectURL('RECORD', 'salesorder', orig_soid);
					
				}
				
			}

		}
		else {
			var error = nlapiCreateError("ERROR", "This Sales Order cannot be combined or merged using this Suitelet. Please merge manually") ;
			nlapiLogExecution('ERROR', 'Exenution Stops', 'Involid Billing Schedule in Original Sales Order: ' + orig_soid);
			throw error.details;
		}
	} else {
		var error = nlapiCreateError('USER_ERROR', 'No Original Sales Order Found', true);
		throw error.details;
	}
}

var findMatchingBillSched = function(orig_so_rec ,end_date) {
	
	var item_count = orig_so_rec.getLineItemCount('item');
	for(var i = 1; i <= item_count; i += 1) {
		if(orig_so_rec.getLineItemValue('item', 'custcol_swe_contract_end_date', i) == end_date) {
			return orig_so_rec.getLineItemValue('item', 'billingschedule', i);
		}
	}
};

var removeMergedItems = function(rec, items) {
	items.forEach(function(item) {
		var currLastLine = rec.getLineItemCount('item');
		rec.removeLineItem('item', currLastLine);
	});
	try {
		nlapiSubmitRecord(rec);
	} catch(e) {
		var error = nlapiCreateError('Error in removing items from upselling sales order', e);
		throw error.details;
	}
};


/**
 * Description : Calculates new list rate if discount is present in original sales order
 * @RETURN : Object 
 * **/
var resolveDiscountRate = function(rate, list_rate, discount) {
	nlapiLogExecution('DEBUG', 'Before New Rate', list_rate + ' ' + rate);
	if(discount.indexOf('%') == -1) {
		var error = nlapiCreateError('USER ERROR', 'Invalid Discount Rate. Discount type must be percent(%) base discount for multi-year Sales Order', false);
		throw error.details;
	} else {
		var newRate = {};
		newRate.rate = +rate / (1 - (parseFloat(discount) / -100));  
		newRate.list_rate = +list_rate / (1 - (parseFloat(discount) / -100));
		nlapiLogExecution('DEBUG', 'New Rate', newRate.list_rate + ' ' + newRate.rate);
		return newRate;
	}
};
