/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Oct 2015     huichanyi
 *
 */

/**
 * @param {nlobjRequest} req Request object
 * @param {nlobjResponse} res Response object
 * @returns {Void} Any output is written via response object
 */



function taBadDebt_PageInit(type) {
	AddJavascript('https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js', 'head');
	AddStyle('https://system.na1.netsuite.com/core/media/media.nl?id=460245&c=1257021&h=1dfd9023815b08328aab&_xt=.css','head');
}

function taBadDebt_beforesave() {
	swal({title: "Processing", text: "Your request is in progress...", showConfirmButton: false });
	return true;
}

function taBadDebt_suitelet(req, res){
	var invId = req.getParameter('invId');
	//var startdate = req.getParameter('startdate');
	var enddate = req.getParameter('enddate');
	
	if(req.getMethod() == 'GET'){
		var today = nlapiDateToString(new Date(), 'MM/DD/YYYY');
		var form = nlapiCreateForm('Bad Debt Process', false);
		form.setScript('customscript_bad_debt_client');
		var customerFld = form.addField('customer', 'text', 'Customer ID');
		customerFld.setLayoutType('normal', 'startcol');
		customerFld.setDefaultValue(nlapiLookupField('invoice', invId, 'custbody_end_user'));
		customerFld.setDisplayType('inline');
		var invoiceId = form.addField('invoice_id', 'text', 'Invoice ID');
		invoiceId.setDefaultValue(invId);
		invoiceId.setDisplayType('inline');
		var startdateFld = form.addField('as_of_date', 'date', 'As of');
		startdateFld.setDefaultValue(today);
		startdateFld.setDisplayType('inline');
		
		form.addSubmitButton('Run Process');
		form.addButton('cancel', 'Cancel', 'setWindowChanged(window, false);history.back();');
		
		res.writePage(form);
	}
	else{
		var invId = req.getParameter('invoice_id');
		var invRec = nlapiLoadRecord('invoice', invId);
		var skipRA = false;
		var today = req.getParameter('as_of_date');
		var invEndDate = invRec.getFieldValue('enddate');
		
		if(nlapiStringToDate(invEndDate) < nlapiStringToDate(today)){
			skipRA = true;
		}
		
		
		// Start the process only if invoice status is Open
		if(invRec.getFieldValue('status') == 'Open'){
			var origTotal = 0;
			var cmTotal = 0;
			// Get the first day of today
			// if Contract Start Date is later than today, startdate is contract start date
			
			var ctrcStartDate = invRec.getFieldValue('startdate');
			var startdate = today;
			nlapiLogExecution('DEBUG', 'Request Params', 'invId = ' + invId + ', ctrcStartDate' + ctrcStartDate + ', startdate = ' + startdate + ', enddate' + enddate);
			// Transforming invoice to return authorization
			
			
			origTotal = parseFloat(invRec.getFieldValue('total'));
			var customerId = invRec.getFieldValue('entity');
			var raRecId;
			
			if(!skipRA){
				
				var raRec = nlapiTransformRecord('invoice', invId, 'returnauthorization');
				raRec.setFieldValue('customform', '165'); //## 165 in prod
				raRec.setFieldValue('custbody_order_type', '13');
				
				raRec.setFieldValue('custbody_swe_rma_header_end_date', enddate);
				raRec.setFieldValue('custbody_swe_rma_header_start_date', startdate);
				var tranTerm = moment(enddate).diff(moment(startdate),'months', true);
				tranTerm = Math.round(tranTerm * 10)/10;
				raRec.setFieldValue('custbody_tran_term_in_months', tranTerm);
				raRec.setFieldValue('custbody_check_log_status', '2');
				var lineItemCount = raRec.getLineItemCount('item');
				nlapiLogExecution('DEBUG', 'Check Line Count', lineItemCount);
				
				// Checks if there is a discount
				// If discount is there, then calculate discount rate
				var discount = MyParseFloat(raRec.getFieldValue('discounttotal'));
				var tranTotal = MyParseFloat(raRec.getFieldValue('subtotal'));
				var discRate = (discount != 0) ?  1-((discount/tranTotal)*-1):1;
				
				// if discount is there, remove discount on the fields
				if(discount != 0){
					raRec.setFieldValue('discountrate', '');
					raRec.setFieldValue('discountitem', '');
				}
				
				
				
				nlapiLogExecution('DEBUG', 'Discount', discount + ', discRate = ' + discRate + ', term = ' + tranTerm);
				
				// iterate through the lines 
				for (var i = 0; i < lineItemCount; i++){
					raRec.selectLineItem('item', i+1);
					
					// if line item start date is greater than today, then don't change the line item start date. 
					// if today's date is later than line item start date, then set it as today's date.
					var lineStartDate;		
					if(nlapiStringToDate(invRec.getLineItemValue('item', 'custcol_swe_contract_start_date', i+1)) > nlapiStringToDate(startdate)){
						lineStartDate = invRec.getLineItemValue('item', 'custcol_swe_contract_start_date', i+1);
					}
					else{
						lineStartDate = startdate;
					}		
					
					var lineEndDate = invRec.getLineItemValue('item', 'custcol_swe_contract_end_date', i+1);
					var lineTerm = moment(lineEndDate).diff(moment(lineStartDate),'months', true);
					var item = raRec.getLineItemValue('item', 'item', i+1);
					var inlineDisc = invRec.getLineItemValue('item', 'custcol_inline_discount', i+1);
					nlapiLogExecution('DEBUG', 'item', item);
					lineTerm = Math.round(lineTerm * 10)/10;
					raRec.setCurrentLineItemValue('item', 'custcol_swe_contract_start_date', lineStartDate);
					raRec.setCurrentLineItemValue('item', 'custcol_swe_contract_end_date', lineEndDate);
					raRec.setCurrentLineItemValue('item', 'custcol_swe_contract_item_term_months', lineTerm);
					var quantity = raRec.getLineItemValue('item', 'quantity', i+1);
					var listrate = 0;
					if(isNotEmpty(inlineDisc)){
						listrate = ((100  - parseFloat(inlineDisc))/ 100) * parseFloat(raRec.getLineItemValue('item', 'custcol_list_rate', i+1));
					}else {
						listrate = raRec.getLineItemValue('item', 'custcol_list_rate', i+1);
					}
					
					raRec.setCurrentLineItemValue('item', 'custcol_list_rate', listrate*discRate);
					var rate = (listrate*discRate)*lineTerm;
					var amount = rate*quantity;
					raRec.setCurrentLineItemValue('item', 'amount', rate);
					raRec.setCurrentLineItemValue('item', 'amount', amount);
					raRec.commitLineItem('item');
					nlapiLogExecution('DEBUG', 'Line Count Loop', 'lineStartDate = ' + lineStartDate + 'lineEndDate = ' + lineEndDate + ', quantity = '+ quantity +', lineTerm = ' + lineTerm + ', amount = '+ amount +', rate = ' + rate);
				}
				
				// submits Return Authorization record after making changes
				raRecId = nlapiSubmitRecord(raRec);
				nlapiLogExecution('DEBUG', 'Return Authorization ID', raRecId);
			}
				
			var cmRecId;
			var balance = 0;
		
			if(isNotEmpty(raRecId)){
				try{
					var cmRec = nlapiTransformRecord('returnauthorization', raRecId, 'creditmemo', {recordmode: 'dynamic'});
					var lineCnt = cmRec.getLineItemCount('apply');
					for(var i = 0; i < lineCnt; i++){
						var internalId = cmRec.getLineItemValue('apply', 'internalid', i+1);
						nlapiLogExecution('DEBUG', 'Apply Internal ID', internalId);
						if(internalId == invId){
							cmTotal = parseFloat(cmRec.getFieldValue('total'));
							cmRec.setFieldValue('unapplied', '0');
							cmRec.setFieldValue('applied', cmTotal);
							
							cmRec.setLineItemValue('apply', 'apply', i+1, 'T');
							cmRec.setLineItemValue('apply', 'amount', i+1, cmTotal);
						}
					}
					cmRec.setFieldValue('memo', 'Bad Debt Automation');
					cmRecId = nlapiSubmitRecord(cmRec, null, true);
					
					nlapiLogExecution('DEBUG', 'Credit Memo ID & Balance', cmRecId);
				}
				catch(e){
					throw "Error in creating Credit Memo : " + e;
				}
		
			}
			
			var jeId;
			var pymtId;
			var remainder = 0;
			
			var invAmtRemaining = parseFloat(nlapiLookupField('invoice', invId, 'amountremaining'));  
			nlapiLogExecution('DEBUG', 'Invoice remaining balance after credit memo', invAmtRemaining);
			
			/*********************************************************************/
			/* If Credit Memo is created and the Invoice has remaining balance,  */
			/*                      then create a Journal Entry                  */
			/*********************************************************************/
			
			if((isNotEmpty(cmRecId) && invAmtRemaining > 0) || skipRA){
				try{
					var jeRec = nlapiCreateRecord('journalentry');
					// round to two decimals
					// remainder = Math.round((origTotal-cmTotal)*100)/100;
					// sets remainder as bad debt - Credits(decreases) AR
					jeRec.selectNewLineItem('line');
					jeRec.setCurrentLineItemValue('line', 'account', '121'); //## 121 in prod
					jeRec.setCurrentLineItemValue('line', 'credit', invAmtRemaining);
					jeRec.setCurrentLineItemValue('line', 'entity', customerId);
					jeRec.commitLineItem('line');
					
					// Debits(increase) bad debt against  
					jeRec.selectNewLineItem('line');
					jeRec.setCurrentLineItemValue('line', 'account', '830');  //## 830 in prod
					jeRec.setCurrentLineItemValue('line', 'debit', invAmtRemaining);
					jeRec.commitLineItem('line');
					
					jeId = nlapiSubmitRecord(jeRec);
				}
				catch(e){
					throw "There was an error creating Journal Entry : " + e;
				}
			}
		
			
			/*******************************************************************
			   
			   Apply journal entry to customer payment to even out the balance
			   
			********************************************************************/
			
			if(isNotEmpty(jeId)){
				try{
					var pymtRec = nlapiTransformRecord('invoice', invId, 'customerpayment', {recordmode: 'dynamic'});
					pymtRec.setFieldValue('ispaymethundepfunds', 'F');
					pymtRec.setFieldValue('undepfunds', 'F');
					pymtRec.setFieldValue('paymentmethod', '9');
					pymtRec.setFieldValue('account', '831'); //## 831 in prod
					pymtRec.setFieldValue('aracct', '121'); //## 121 in prod
					var crLineCnt = pymtRec.getLineItemCount('credit');
					var applyLineCtn = pymtRec.getLineItemCount('apply');
					
					for(var x = 0; x < applyLineCtn; x++){
						var applyInteralId = pymtRec.getLineItemValue('apply', 'internalid', x+1);
						var applyDue = pymtRec.getLineItemValue('apply', 'due', x+1);
						if( invId == applyInteralId) {
							pymtRec.setLineItemValue('apply', 'apply', x+1, 'T');
							pymtRec.setLineItemValue('apply', 'amount', x+1, applyDue);
						}
					}
					
					for(var i = 0; i < crLineCnt; i++){
						var crInternalId = pymtRec.getLineItemValue('credit', 'internalid', i+1);
						var crDue = pymtRec.getLineItemValue('credit', 'due', i+1);
						if(jeId == crInternalId){
							pymtRec.setLineItemValue('credit', 'apply', i+1, 'T');
							pymtRec.setLineItemValue('credit', 'amount', i+1, crDue);
						}
					}
					
					pymtRec.setFieldValue('payment', '0');
					
					
					pymtId = nlapiSubmitRecord(pymtRec);
				}
				catch(e){
					throw "Error in applying Journal Entry to Invoice. Error Code :" + e;
				}
			}
			
			if(isNotEmpty(pymtId)){
				try{
					nlapiSubmitField('customer', customerId, 'creditholdoverride', 'ON');
				}
				catch(e){
					throw e;
				}
			}
			
			nlapiSetRedirectURL('RECORD', 'invoice', invId);
			
			
		}else{
			throw "Unable to process the request. The invoice has applied payment";
		}
	}
}
