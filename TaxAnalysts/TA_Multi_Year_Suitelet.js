/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 Mar 2015     huichanyi
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
/*
function update_projected_total_btn(){
	var esid = nlapiGetRecordId();
	var url = nlapiResolveURL('SUITELET', 'customscript_update_projected_total','customdeploy1');
	url += '&esid='+esid;
	window.open(url,'_self');	
}
*/


function multiyearConversion(request, response){
	var esid = request.getParameter('esid');
	var form = nlapiCreateForm('Multi Year Assistance');
	form.setScript('customscript_ta_multiyear_client');
	if(request.getMethod() == 'GET'){
		nlapiLogExecution('debug', 'multiyearConversion', 'multiyearConversion: '+ request);
		
		nlapiLogExecution('debug', 'Suitelet Begins', 'esid = ' + esid);
		
		var esrec = nlapiLoadRecord('estimate', esid);
		var shipping_items = ['2074', '2075'];
		// getting essential information to calculate regular price total
		var regPriceItemsAmounts = new Array();
		var regPriceTotal = 0;
		var shipping_price_total = 0;
		var itemcount = esrec.getLineItemCount('item');
		for(var i = 1; i <= itemcount; i++){
			var itemType = esrec.getLineItemValue('item', 'itemtype', i);
			var itemId = esrec.getLineItemValue('item', 'item', i);
			var itemQty = esrec.getLineItemValue('item', 'quantity', i);
			var item_rate = esrec.getLineItemValue('item', 'rate', i);
			if( shipping_items.indexOf(itemId) > -1){
				shipping_price_total += item_rate;
			}
			var lineItemRegRate = taLineItemMatrixPrice(itemType, itemId, itemQty);
			var regAmount = parseFloat(lineItemRegRate * itemQty);
			regPriceItemsAmounts.push(regAmount);
		}
		nlapiLogExecution('debug', 'multiyearConversion: GET', 'regPriceItemsAmounts: ' + regPriceItemsAmounts);

		for(var i = 0; i < regPriceItemsAmounts.length; i++){
			regPriceTotal += regPriceItemsAmounts[i];
		}
		
		nlapiLogExecution('debug', 'multiyearConversion', 'Regular Pricing Total: regPriceTotal ' + regPriceTotal);
		
		form.addSubmitButton('Update to Multi Year Quote');
		
		//left column
		//var group1 = form.addFieldGroup('yeargroup', 'CONTRACT LENGTH');
		form.addField('contractlengthlabel', 'label', '1. Select length of contract in months', null).setLayoutType('normal', 'startcol');
		form.addField('contractlength', 'radio', '24 months', '24');
		form.addField('contractlength', 'radio', '36 months', '36');
		form.addField('contractlength', 'radio', '48 months', '48');
		form.addField('contractlength', 'radio', '60 months', '60');
		form.addField('recordid', 'integer', 'Quote Internal ID', null).setDisplayType('hidden');
		form.addField('listratedefactor', 'float', 'List Rate Re-distribute Weight', null).setDisplayType('disabled');
		form.addField('rebalancecheck', 'checkbox', 'Rebalance Rate?');
		//form.getField('recordid').setLayoutType('outsideabove');
	
		
		//var group2 = form.addFieldGroup('upliftgroup', 'UPLIFT');		
		
		// right column
		var pricingModel = form.addField('pricingmodel', 'select', '2. Select the pricing model', 'customlist_multi_year_pricing_select').setLayoutType('normal', 'startcol');
		
		form.addField('uplift', 'percent', 'Type in uplift percentage', null).setPadding(1);
		form.addField('firstyear_total', 'inlinehtml', 'First Year Total (w/Discount, excluding Shipping Charges)', null).setPadding(1).setDisplayType('disabled');//.setDisplayType('hidden');
		form.addField('firstyear_subtotal', 'currency', 'First Year Subtotal (Without Discount, exluding Shipping Charges)', null).setDisplayType('disabled');
		form.addField('secondyearprice', 'currency', 'Second Year Total', null).setDisplayType('disabled');
		form.addField('thirdyearprice', 'currency', 'Third Year Total', null).setDisplayType('disabled');
		form.addField('fourthyearprice', 'currency', 'Fourth Year Total', null).setDisplayType('disabled');
		form.addField('fifthyearprice', 'currency', 'Fifth Year Total', null).setDisplayType('disabled');
		// getting value from the estimate record
		var firstyearvalue_subtotal = parseFloat(esrec.getFieldValue('subtotal')) - parseFloat(shipping_price_total);
		var firstyearvalue_total = parseFloat(esrec.getFieldValue('total')) - parseFloat(shipping_price_total);
		// calculating the listrate distribution. 
		var listrateDistributor = parseFloat(firstyearvalue_subtotal/regPriceTotal);
		nlapiLogExecution('debug', 'multiyearConversion GET', 'List Rate Distributor Value : ' + listrateDistributor);
		// setting display size and default values
		form.getField('contractlengthlabel').setDisplaySize(30);
		form.getField('contractlength').setDefaultValue('36');
		form.getField('uplift').setDisplayType('disabled');
		form.getField('uplift').setDefaultValue('4%');
		form.getField('recordid').setDisplaySize(30);
		form.getField('firstyear_total').setDisplaySize(20);
		pricingModel.setDefaultValue('');
		
		//getting regular priced for listrateDistributor of listrate 

		form.setFieldValues({firstyear_total: firstyearvalue_total, recordid: esid, firstyear_subtotal: firstyearvalue_subtotal, listratedefactor: listrateDistributor});		
		response.writePage(form);		
		
	}else {

		var esid = request.getParameter('recordid');
		var pricingModel = request.getParameter('pricingmodel'); 
		var quoteInMonth = request.getParameter('contractlength');
		var uplift = request.getParameter('uplift');
		var firstYearAmt = request.getParameter('firstyear_subtotal');
		var secondYearAmt = request.getParameter('secondyearprice');
		var thirdYearAmt = request.getParameter('thirdyearprice');
		var fourthYearAmt = request.getParameter('fourthyearprice');
		var fifthYearAmt = request.getParameter('fifthyearprice');
		var isRebalanceChecked = request.getParameter('rebalancecheck'); 
		var esrec = nlapiLoadRecord('estimate', esid);
		var listrateDistributor = request.getParameter('listratedefactor');
		nlapiLogExecution( 'debug', 'multiyearConversion', 'multiyearConversion Post: contractlength = '+ quoteInMonth+ ', esid = ' + esid + ', incline: '+ uplift + ', firstyear: ' + firstYearAmt );
		
		// double loop contract year from second year >
		// select new line 
		
		// getting field values from the GET method
		var startdate = esrec.getFieldValue('startdate');
		var enddate = esrec.getFieldValue('enddate');
		var currentQuoteLength = esrec.getFieldValue('custbody_tran_term_in_months'); 
		var quoteInYear = quoteInMonth / 12;
		var quoteInDays = quoteInYear * 365;
		var quoteEndDate = changeDate(startdate, quoteInDays, 'day');
		
		nlapiLogExecution('debug', 'multiyearConversion', 'momentjs contractEndDate = ' + quoteEndDate + ', Quote in Years: ' + quoteInYear);
		
		// setting new contract end date and length
		var newQuoteLength = quoteInMonth - currentQuoteLength;
		esrec.setFieldValue('custbody_tran_term_in_months', quoteInMonth);
		esrec.setFieldValue('enddate', nlapiDateToString(quoteEndDate));		
		

		var initLineCount = esrec.getLineItemCount('item'); 
		
		// adding subtotal for first year
		if (initLineCount > 1){
			esrec.selectNewLineItem('item');
			esrec.setCurrentLineItemValue('item', 'item', '-2');
			esrec.setCurrentLineItemValue('item', 'custcol_ta_no_display', 'T');
			esrec.commitLineItem('item', false);
		}
		var x;
		for(x = 1; x < quoteInYear; x++ ){
			var lastLoop = quoteInYear - 1;
			var isLast = (x == lastLoop ? true:false);
			
			for(var y = 1; y <= initLineCount; y++){
				
				var quantity = esrec.getLineItemValue('item', 'quantity', y);
				
				// run this only on line quantity is greater than 0
				if(quantity > 0){
					
					var origLineItem = esrec.getLineItemValue('item', 'item', y);
					var prevEndDate = esrec.getLineItemValue('item', 'custcol_swe_contract_end_date', y);
					var itemtype = esrec.getLineItemValue('item', 'itemtype', y);
					var priceLevel = esrec.getLineItemValue('item', 'price', y);
					var term = esrec.getLineItemValue('item', 'custcol_swe_contract_item_term_months', y)
					var rate = esrec.getLineItemValue('item', 'rate', y);
					var listrate = esrec.getLineItemValue('item', 'custcol_list_rate', y);
					var shipping_items = ['2074', '2075']; //2074, 2075  (D & I) Prod
					nlapiLogExecution('debug', 'multiyearConversion', 'rate from Quote :' + rate);
					
					// changing date for new line items
					var newContractStartDate = changeDate(prevEndDate, 1, 'day');
					var currentEndDate = changeDate(newContractStartDate, 364, 'day');
					
					//defining itemtype for Item Record Object
					
					/************
					var regRate = taLineItemMatrixPrice(itemtype, itemId, itemQty)
					(regRate / term) * factor  
					*************/
					// Rebalance pricing if requested
					if(isRebalanceChecked == 'T'){
					
						// getting regular pricing 
						var regularRate = taLineItemMatrixPrice(itemtype, origLineItem, quantity);
						var regularListRate = parseFloat(regularRate/quantity);
						var factoredListRate = (regularRate/term) * listrateDistributor;
						var newRate = factoredListRate * term;
						nlapiLogExecution('debug', 'POST Line 182 = ', 'regularRate: ' + regularRate + ', regularListRate' + regularListRate);
						
						//changing original line items price, price level and billing schedule
						esrec.setLineItemValue('item', 'price', y, '-1');
						esrec.setLineItemValue('item', 'custcol_list_rate', y, factoredListRate);
						esrec.setLineItemValue('item', 'rate', y, newRate);
					}else {
						var newRate =  rate;
						var factoredListRate = listrate;
						esrec.setLineItemValue('item', 'price', y, '-1');
						esrec.setLineItemValue('item', 'custcol_list_rate', y, factoredListRate);
						esrec.setLineItemValue('item', 'rate', y, newRate);
						nlapiLogExecution('debug', 'isBalanceChecked = False', 'newRate = ' + newRate + ', factoredListRate: '+ factoredListRate + 'listrate : ' + listrate);
					}
					// setting currect line item values
					esrec.selectNewLineItem('item');
					esrec.setCurrentLineItemValue('item', 'item', origLineItem);
					esrec.setCurrentLineItemValue('item', 'price', '-1');
					esrec.setCurrentLineItemValue('item', 'quantity', quantity);
					//billing schedule nlapiSetCurrentLineItemValue('item', 'billingschedule', '41')
					// billing schedule internal id 
					// year 1 = 39
					// year 2 = 44
					// year 3 = 45
					// year 4 = 46
					// year 5 = 47
					
					// setting dates, uplift and billing schedule for 2nd year
					if( x == 1 ){
						esrec.setCurrentLineItemValue('item', 'billingschedule', '44');
						esrec.setCurrentLineItemValue('item', 'custcol_swe_contract_item_term_months', '12');
						esrec.setCurrentLineItemValue('item', 'custcol_swe_contract_start_date', nlapiDateToString(newContractStartDate));
						esrec.setCurrentLineItemValue('item', 'custcol_swe_contract_end_date', nlapiDateToString(currentEndDate));
						
						if(shipping_items.indexOf(origLineItem) == -1){
						
							// setting rate based on pricingModel selection 
							switch(pricingModel){
							case '1':	
								esrec.setCurrentLineItemValue('item', 'rate', priceUplift(newRate, parseInt(uplift), x));
								esrec.setCurrentLineItemValue('item', 'custcol_list_rate', priceUplift(listrate, parseInt(uplift), x));
								break;
							case '2':
								esrec.setCurrentLineItemValue('item', 'rate', newRate);
								esrec.setCurrentLineItemValue('item', 'custcol_list_rate', listrate);
								break;
							case '3': // This needs to be updated with new calculation
								var rateIncreased = calcDefactor(parseFloat(firstYearAmt), parseFloat(secondYearAmt));
								nlapiLogExecution('debug', 'calcDefactor', rateIncreased);
								var newrate = newRate * rateIncreased;
								var newlistrate = factoredListRate * rateIncreased;
								esrec.setCurrentLineItemValue('item', 'rate', newrate );
								esrec.setCurrentLineItemValue('item', 'custcol_list_rate', newlistrate);
								break;
							}
						}else{
							esrec.setCurrentLineItemValue('item', 'rate', rate);
							esrec.setCurrentLineItemValue('item', 'custcol_list_rate', listrate);
						}
					}
					
					// setting dates and uplift for 3rd year
					if( x == 2 ){
						
						newContractStartDate = changeDate(currentEndDate, 1, 'day');
						currentEndDate = changeDate(newContractStartDate, 364, 'day');
						esrec.setCurrentLineItemValue('item', 'billingschedule', '45');
						esrec.setCurrentLineItemValue('item', 'custcol_swe_contract_item_term_months', '12');
						esrec.setCurrentLineItemValue('item', 'custcol_swe_contract_start_date', nlapiDateToString(newContractStartDate));
						esrec.setCurrentLineItemValue('item', 'custcol_swe_contract_end_date', nlapiDateToString(currentEndDate));
						
						
						if(shipping_items.indexOf(origLineItem) == -1){
						// setting rate based on pricingModel selection 
						
							switch(pricingModel){
							case '1':	
								esrec.setCurrentLineItemValue('item', 'rate', priceUplift(newRate, parseInt(uplift), x));
								esrec.setCurrentLineItemValue('item', 'custcol_list_rate', priceUplift(listrate, parseInt(uplift), x));
								break;
							case '2':
								esrec.setCurrentLineItemValue('item', 'rate', newRate);
								esrec.setCurrentLineItemValue('item', 'custcol_list_rate', listrate);
								break;
							case '3': // This needs to be updated with new calculation
								var rateIncreased = calcDefactor(parseFloat(firstYearAmt), parseFloat(thirdYearAmt));
								nlapiLogExecution('debug', 'calcDefactor', rateIncreased);
								var newrate = newRate * rateIncreased;
								var newlistrate = listrate * rateIncreased;
								esrec.setCurrentLineItemValue('item', 'rate', newrate );
								esrec.setCurrentLineItemValue('item', 'custcol_list_rate', newlistrate);
								break;
							}
						}else{
							esrec.setCurrentLineItemValue('item', 'rate', rate);
							esrec.setCurrentLineItemValue('item', 'custcol_list_rate', listrate);
						}
					}
					// setting dates and uplift for 4th year
					if( x == 3 ) {
						
						newContractStartDate = changeDate(currentEndDate, 366, 'day');
						currentEndDate = changeDate(newContractStartDate, 364, 'day');
						esrec.setCurrentLineItemValue('item', 'billingschedule', '46');
						esrec.setCurrentLineItemValue('item', 'custcol_swe_contract_item_term_months', '12');
						esrec.setCurrentLineItemValue('item', 'custcol_swe_contract_start_date', nlapiDateToString(newContractStartDate));
						esrec.setCurrentLineItemValue('item', 'custcol_swe_contract_end_date', nlapiDateToString(currentEndDate));
						
						if(shipping_items.indexOf(origLineItem) == -1){
						// setting rate based on pricingModel selection 
							switch(pricingModel){
							case '1':	
	
								esrec.setCurrentLineItemValue('item', 'rate', priceUplift(newRate, parseInt(uplift), x));
								esrec.setCurrentLineItemValue('item', 'custcol_list_rate', priceUplift(listrate, parseInt(uplift), x));
								break;
							case '2':
								esrec.setCurrentLineItemValue('item', 'rate', newRate);
								esrec.setCurrentLineItemValue('item', 'custcol_list_rate', listrate);
								break;
							case '3': // This needs to be updated with new calculation
								var rateIncreased = calcDefactor(parseFloat(firstYearAmt), parseFloat(fourthYearAmt));
								nlapiLogExecution('debug', 'calcDefactor', rateIncreased);
								var newrate = newRate * rateIncreased;
								var newlistrate = listrate * rateIncreased;
								esrec.setCurrentLineItemValue('item', 'rate', newrate );
								esrec.setCurrentLineItemValue('item', 'custcol_list_rate', newlistrate);
								break;
							}
						}else{
							esrec.setCurrentLineItemValue('item', 'rate', rate);
							esrec.setCurrentLineItemValue('item', 'custcol_list_rate', listrate);
						}
					}
					//setting dates and uplift for 5th year
					if( x == 4 ) {
						
						newContractStartDate = changeDate(currentEndDate, 366, 'day');
						currentEndDate = changeDate(newContractStartDate, 364, 'day');
						esrec.setCurrentLineItemValue('item', 'billingschedule', '47');
						esrec.setCurrentLineItemValue('item', 'custcol_swe_contract_item_term_months', '12');
						esrec.setCurrentLineItemValue('item', 'custcol_swe_contract_start_date', nlapiDateToString(newContractStartDate));
						esrec.setCurrentLineItemValue('item', 'custcol_swe_contract_end_date', nlapiDateToString(currentEndDate));
						
						if(shipping_items.indexOf(origLineItem) == -1){
						// setting rate based on pricingModel selection 
							switch(pricingModel){
							case '1':	
		
								esrec.setCurrentLineItemValue('item', 'rate', priceUplift(newRate, parseInt(uplift), x));
								esrec.setCurrentLineItemValue('item', 'custcol_list_rate', priceUplift(listrate, parseInt(uplift), x));
								break;
							case '2':
								esrec.setCurrentLineItemValue('item', 'rate', newRate);
								esrec.setCurrentLineItemValue('item', 'custcol_list_rate', listrate);
								break;
							case '3': // This needs to be updated with new calculation
								var rateIncreased = calcDefactor(parseFloat(firstYearAmt), parseFloat(fifthYearAmt));
								nlapiLogExecution('debug', 'calcDefactor', rateIncreased);
								var newrate = newRate * rateIncreased;
								var newlistrate = listrate * rateIncreased;
								esrec.setCurrentLineItemValue('item', 'rate', newrate );
								esrec.setCurrentLineItemValue('item', 'custcol_list_rate', newlistrate);
								break;
							}
						}else{
							esrec.setCurrentLineItemValue('item', 'rate', rate);
							esrec.setCurrentLineItemValue('item', 'custcol_list_rate', listrate);
						}
					}	
					nlapiLogExecution('debug', 'multiYearConversion', 'Regular Price from Matrix Pricing : ' + regularRate);
					//adding subtotal to end of line
							
					// setting fields based on last year or not 
					if(!isLast){
						esrec.setLineItemValue('item', 'custcol_renewals_exclusion', y, 'T');
						esrec.setCurrentLineItemValue('item', 'custcol_renewals_exclusion', 'T');
					}
					else{
						esrec.setLineItemValue('item', 'custcol_renewals_exclusion', y, 'T');
						esrec.setCurrentLineItemValue('item', 'custcol_renewals_exclusion', 'F');
					}
					esrec.commitLineItem('item', true);
				}else{
					// if quantity is 0 (downsell) make is not appear in pdf
					esrec.setLineItemValue('item', 'custcol_ta_no_display', y,'T');
				}
			}
			//adding subtotal to each years
			if(initLineCount > 1){
				esrec.selectNewLineItem('item');
				esrec.setCurrentLineItemValue('item', 'item', '-2');
				esrec.setCurrentLineItemValue('item', 'custcol_ta_no_display', 'T');
				esrec.commitLineItem('item', false);
			}
		}
		
		// submitting changes and redirecting to the quote
		nlapiSubmitRecord(esrec, false, true);
		nlapiSetRedirectURL('RECORD','estimate', esid);
		
	}
}


// manipulating date using moment.js
function changeDate(date, number, adjustBy){
	var newDate = moment(date).add(number, adjustBy);
	return newDate = new Date(newDate._d);
}



// calculate uplift rate
function priceUplift(rate, incline, year) {
	var amount = rate;
	for(var i = 0; i < year; i++) {
		amount = amount * (1 + (incline/100));
	}
	return amount;
}

// function to return regular pricing for item
function taLineItemMatrixPrice(itemtype, itemId, itemQty) {
	var price = 0;
	if(itemtype == "NonInvtPart" || itemtype == "Kit"){
		itemtype = itemtype == 'NonInvtPart' ? 'noninventoryitem' : 'kititem';
		var itemRec = nlapiLoadRecord(itemtype, itemId);
		//itemRec.getLineItemMatrixValue('price', 'price', 1, 3)
		if(itemQty <= 5){
			price = itemRec.getLineItemMatrixValue('price', 'price', 1, 1);
		}else if(itemQty <= 10){
			price = itemRec.getLineItemMatrixValue('price', 'price', 1, 2);
		}else if(itemQty <= 20){
			price = itemRec.getLineItemMatrixValue('price', 'price', 1, 3);
		}else if(itemQty <= 40){
			price = itemRec.getLineItemMatrixValue('price', 'price', 1, 4);
		}else if(itemQty <= 75){
			price = itemRec.getLineItemMatrixValue('price', 'price', 1, 5);	
		}else {
			price = itemRec.getLineItemMatrixValue('price', 'price', 1, 6);
		}
		return price;
	}else{
		return;
	}

}

function calcDefactor(baseyear, factoryear) {
	var rateIncreased = 0;
	if (baseyear < factoryear){
		rateIncreased = factoryear/baseyear;
	}
	return parseFloat(rateIncreased);
}





