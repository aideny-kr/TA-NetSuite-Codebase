/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Jun 2015     Dana
 *
 */
function clientPageInit(type){
	AddJavascript('https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js', 'head');
	AddStyle('https://system.na1.netsuite.com/core/media/media.nl?id=460245&c=1257021&h=1dfd9023815b08328aab&_xt=.css','head');
}

function ccerp_ExpenseAllocation_Suitelet(request, response){
	nlapiLogExecution('DEBUG', 'BEGIN GET ');

	if (request.getMethod() == 'GET') {
		nlapiLogExecution('DEBUG', 'BEGIN GET');
		
		// create list
		var form = nlapiCreateForm('Expense Allocation');
		form.addSubmitButton('Submit');
		form.addResetButton();
		form.addButton('custpage_cancel_btn', 'Cancel','setWindowChanged(window, false);history.back();');
		var sublist = form.addSubList('sublist', 'list', 'Expense Reports');
		sublist.addMarkAllButtons();
		sublist.addField('apply', 'checkbox', 'Apply');
		sublist.addField('erid', 'text', 'Expense Report ID').setDisplayType('inline');
		sublist.addField('ernumber', 'text','Expense Report').setDisplayType('inline');
		sublist.addField('period', 'text', 'Period').setDisplayType('inline');
		sublist.addField('name', 'text', 'Name').setDisplayType('inline');
		sublist.addField('amount', 'currency', 'Amount').setDisplayType('inline');
		
		// search for records
		var erfils = [];
		var erresults = nlapiSearchRecord('transaction','customsearch__exprpt_allocation_suitelet', erfils);
		if (isNotEmpty(erresults)) {
			for ( var i = 0; i < erresults.length; i++) {
				sublist.setLineItemValue('erid', i + 1, erresults[i].getValue('internalid',null,'group'));
				sublist.setLineItemValue('ernumber', i + 1, erresults[i].getValue('tranid',null,'group'));
				sublist.setLineItemValue('period', i + 1, erresults[i].getText('postingperiod',null,'group'));
				sublist.setLineItemValue('name', i + 1, erresults[i].getText('mainname',null,'group'));
				sublist.setLineItemValue('amount', i + 1, erresults[i].getValue('amount',null,'sum'));
			}
		}
		response.writePage(form);
	}

	// request.getMethod() == 'POST'
	else {
		nlapiLogExecution('DEBUG', 'BEGIN POST');

		
		var count = request.getLineItemCount('sublist');
		nlapiLogExecution('DEBUG', 'count ' + count);
		//var erids = [];
		for ( var i = 1; i <= count; i++) {
			var apply = request.getLineItemValue('sublist', 'apply', i);
			if (apply == 'T'){
				var erid = request.getLineItemValue('sublist', 'erid', i);
				if(isNotEmpty(erid)){
					var errec = nlapiLoadRecord('expensereport',erid);
					nlapiSubmitRecord(errec);
				}
			}
		}
		var params = [];
		params['primarykey']='';
		params['date']='TODAY';
		params['scripttype']='211';
		nlapiSetRedirectURL('TASKLINK','LIST_SCRIPTSTATUS',null,null,params);
		return;
	}
}

function ta_ExpenseReport_FieldChanged(type, name, linenum){
	if(type == 'expense' && name == 'receipt'){
		nlapiSetCurrentLineItemValue(type, 'custcol_ta_receipt_check', nlapiGetCurrentLineItemValue(type, name), false, true);
	}
}

function ccerp_ExpenseReport_ValidateInsert(type) {
	var role = nlapiGetRole();
	if(role != '3' && role != '1034' && role != '1024'){
		if(type=='expense' && nlapiGetFieldValue('customform') == '160'){
			swal("Sorry","You are not allowed to insert additional line.","error");
			return false;
		}else{
			return true;
		}
	}else{
		return true;
	}
}

function ccerp_ExpenseReport_ValidateDelete(type) {
	var role = nlapiGetRole();
	if(role != '3' && role != '1034' && role != '1024'){
		if(type=='expense' && nlapiGetFieldValue('customform') == '160'){
			swal("Sorry",'You are not allowed to delete any lines', "error");
			return false;
		}else{
			return true;
		}
	}else{
		return true;
	}
}

function ccerp_ExpenseReport_SaveRecord() {
	
	if(nlapiGetFieldValue('customform') == '160'){
	
		var lineItemCount = nlapiGetLineItemCount('expense');
		var counter = 0;
		for(var i = 0; i < lineItemCount; i++){
			if(nlapiGetLineItemValue('expense', 'category', i+1) == '216'){
				counter++;
			}
		}
		if(counter > 0 && nlapiGetFieldValue('complete') == 'T'){
			swal("Error",'Please categorize each line of expense before mark it as complete. \n "To Be Classified" needs to be categorized properly.', "error");
			nlapiSetFieldValue('complete', 'F');
			return false;
		}
		else if(nlapiGetFieldValue('complete') == 'F'){
			swal("Saved for now!", "Please complete me later", "success");
			return true;
		}else{
			swal({"title": "Submitted for approval!", "type": "success", "showConfirmButton": false});
			return true;
		}
	}
	else{
		return true;
	}
}
function ccerp_ExpenseReport_BeforeLoad(type, form, request){
	var role = nlapiGetRole();
	// setting some fields disabled and some fields mandatory
	nlapiLogExecution('debug', 'ccerp_ExpenseReport_BeforeLoad', "type = "+type);
	if (type == 'view' || type == 'create'){
		nlapiGetLineItemField('expense', 'custcol_ccerpamount') ? nlapiGetLineItemField('expense', 'custcol_ccerpamount').setDisplayType('hidden') : null;
	}
	if(type == 'view' || type == 'create' || type == 'edit'){
		if(role != '3'){
			nlapiGetLineItemField('expense', 'custcol_ta_receipt_check')? nlapiGetLineItemField('expense', 'custcol_ta_receipt_check').setDisplayType('hidden') : null;	
		}
	}
	if( nlapiGetFieldValue('customform') == '160' && (type=='edit' || type=='view')){
		// hiding Advance To Apply field 
		var advanceField = nlapiGetField('advance');
		var advanceAcctField = nlapiGetField('advanceaccount');
		advanceField.setDisplayType('hidden');
		advanceAcctField.setDisplayType('hidden');
		form.removeButton('resetter');
		if(role != '3' && role != '1034' && role != '1024'){
			if(type=='edit'){
				nlapiGetLineItemField('expense', 'amount').setDisplayType('hidden');
			}
			var fields = ['refnumber','amount','expensedate','memo','isnonreimbursable'];
			for(r in fields){
				var field = nlapiGetLineItemField('expense', fields[r]);
				field.setDisplayType('disabled');
			}
			var form = nlapiGetFieldValue('customform');
			if (form == '160' && type == 'edit'){
				nlapiGetLineItemField('expense', 'amount').setDisplayType('hidden');
			}
			var purposeField = nlapiGetField('memo');
			var trandateField = nlapiGetField('trandate');
			var purposeLineField = nlapiGetLineItemField('expense', 'custcol_ta_expense_purpose');
			purposeField.setDisplayType('inline');
			trandateField.setDisplayType('inline');
			purposeLineField.setMandatory(true);
		}
	}
}

function ta_ExpenseReport_BeforeSubmit(type) {
	if(type == 'create' || type == 'edit'){
		if(nlapiGetFieldValue('customform') == '160'){
			var expenseTotal = 0;
			for(var i = 0; i < nlapiGetLineItemCount('expense'); i++){
				expenseTotal += parseFloat(nlapiGetLineItemValue('expense', 'amount', i+1));
			}
			nlapiSetFieldValue('custbody_cc_expense_total', expenseTotal);
		}
	}
}

function ccerp_ExpenseReport_AfterSubmit(type){

	
	var context = nlapiGetContext();
	var execontext = context.getExecutionContext();
	var erid = nlapiGetRecordId();
	nlapiLogExecution('debug','execontext '+execontext);
	
	if (type == 'edit' && execontext == 'suitelet'){
		
		var total = nlapiGetFieldValue('total');
		var customform = nlapiGetFieldValue('customform');
		var expAllocationJE = nlapiGetFieldValue('custbody_expenseallocation_jeid');
		if (customform=='160' && isEmpty(expAllocationJE)){
			var params = [];
			params['custscript_erallocation_id'] = erid;
			params['custscript_erallocation_total'] = total;
			var status = nlapiScheduleScript('customscript_ccerp_exprptallocation_sche',null, params);
			nlapiLogExecution('debug','status '+status);
			
		}
	}
	
	if (type == 'create' && execontext == 'csvimport') {
		var name = nlapiGetFieldValue('entity');
		if (name == '17748' || name == '17804') {
			var title = 'Expense Report is Ready to be Completed';
			var author ='17857'; // Duc
			var recipient = '17758'; // Melanie
			var base = 'https://system.na1.netsuite.com';
			var url = nlapiResolveURL('RECORD', 'expensereport', erid);
			var body = 'Hello. Here is the link to access the record <br/>' + 
				'<a href="' + base + url + '"> EXPENSE REPORT RECORD LINK</a>';
			nlapiSendEmail(author, recipient, title, body);
		}
	}
}



function ccerp_ExpenseReportAllocation_SCHED(){
	
	var context = nlapiGetContext();
	var erid = context.getSetting('SCRIPT','custscript_erallocation_id');
	var total = 0;
	nlapiLogExecution('debug','erid '+erid);
	//First search for Rev Rec Journal Entries
	
	
	var fils = [];
	fils.push(new nlobjSearchFilter('internalid',null,'is',erid));
	var erresults = nlapiSearchRecord(null,'customsearch__expensereport_allocation',fils);
	if (isNotEmpty(erresults)){
		var jerec = nlapiCreateRecord('journalentry');
		nlapiLogExecution('debug','erresults.length '+erresults.length);
		for (var i = 0; i < erresults.length; i++) {
			var dbacct = erresults[i].getValue('account');
			var memo = erresults[i].getValue('memo');
			var purpose = erresults[i].getValue('custcol_ta_expense_purpose');			
			var dept = erresults[i].getValue('department');
			var classification = erresults[i].getValue('class');
			var dbtAmount = +erresults[i].getValue('debitamount');
			var crAmount = +erresults[i].getValue('creditamount');
			dbtAmount.toFixed(2);
			crAmount.toFixed(2);
			jerec.selectNewLineItem('line');
			jerec.setCurrentLineItemValue('line', 'account', dbacct);
			jerec.setCurrentLineItemValue('line', 'memo', memo+' - '+purpose);
			jerec.setCurrentLineItemValue('line', 'credit', crAmount);
			jerec.setCurrentLineItemValue('line', 'debit', dbtAmount);
			dbacct == '820' ? jerec.setCurrentLineItemValue('line', 'department', '37') : jerec.setCurrentLineItemValue('line', 'department', dept); 	
			jerec.setCurrentLineItemValue('line', 'class', classification);
			jerec.commitLineItem('line');
			total += (dbtAmount-crAmount);
			nlapiLogExecution('debug','total '+total);
			nlapiLogExecution('debug','dbtAmount '+dbtAmount);
			nlapiLogExecution('debug','crAmount '+crAmount);
			// Check usageRemaining
			var usageRemaining = parseFloat(context.getRemainingUsage());
			//nlapiLogExecution('debug','i '+i+' usageRemaining '+usageRemaining);
			context.setPercentComplete(roundNumber((100 * i) / erresults.length,2));
			context.getPercentComplete();
			if ((usageRemaining <= 300 && (i + 1) < mainResults.length) || i == 999) {
				var status = nlapiScheduleScript(context.getScriptId(), null);
				if (status == 'QUEUED')
					break;
			}
				
		}
		total = total.toFixed(2);
		nlapiLogExecution('debug','total '+total);
		jerec.selectNewLineItem('line');
		jerec.setCurrentLineItemValue('line', 'account', '820');
		if(total > 0){
			jerec.setCurrentLineItemValue('line', 'credit', total);
		}
		else{
			jerec.setCurrentLineItemValue('line', 'debit', total*-1);
		}
		jerec.commitLineItem('line');
		
		var allocationjeid = nlapiSubmitRecord(jerec);
		nlapiSubmitField('expensereport',erid,'custbody_expenseallocation_jeid',allocationjeid);
	}
	
}

