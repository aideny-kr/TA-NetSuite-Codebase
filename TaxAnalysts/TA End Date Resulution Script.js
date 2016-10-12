/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Sep 2015     Chan
 *
 */
/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Sep 2015     huichanyi
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function taEndDateResolution_suitelet(request, response){
	
	if(request.getMethod() == 'GET'){
		var form = nlapiCreateForm('End Date Resolution Center', false);
		form.setScript('customscript_ta_end_date_client');
		form.addFieldGroup('custpage_options', 'Options');
		var new_enddate = form.addField('new_enddate', 'date', 'New End Date', null, 'custpage_options');
		new_enddate.setMandatory(true);
		
		var user_sublist = form.addSubList('user_sublist', 'list', 'List of Expiring User(s)');
		user_sublist.addMarkAllButtons();
		user_sublist.addField('userlist_apply', 'checkbox', 'Apply');
		user_sublist.addField('userlist_company', 'text', 'Customer');
		user_sublist.addField('userlist_contract', 'text', 'Contract');
		user_sublist.addField('userlist_email', 'email', 'Email');
		user_sublist.addField('userlist_enddate', 'date', 'End Date');
		//user_sublist.addField('userlist_firstname', 'text', 'First Name');
		//user_sublist.addField('userlist_lastname', 'text', 'Last Name');
		user_sublist.addField('userlist_items', 'textarea', 'Items');
		var webuser_id_fld = user_sublist.addField('userlist_id', 'text', 'Web User ID');
		webuser_id_fld.setDisplayType('hidden');

		var freeuser_sublist = form.addSubList('freeuser_sublist', 'list', 'List of Expiring Free Trial(s)');
		freeuser_sublist.addMarkAllButtons();
		freeuser_sublist.addField('freeuserlist_apply', 'checkbox', 'Apply');
		freeuser_sublist.addField('freeuserlist_company', 'text', 'Customer');
		freeuser_sublist.addField('freeuserlist_email', 'email', 'Email');
		freeuser_sublist.addField('freeuserlist_enddate', 'date', 'End Date');
		freeuser_sublist.addField('freeuserlist_items', 'textarea', 'Items');
		var freeuser_id_fld = freeuser_sublist.addField('freeuserlist_id', 'text', 'Web User ID');
		freeuser_id_fld.setDisplayType('hidden');
		var freetrial_counter = 0;
		var user_counter = 0;
		
		var srchFlt = [
		               new nlobjSearchFilter('salesrep', 'CUSTRECORD_CONTRACTUSER_CUSTOMER', 'is', '@CURRENT@'),
		               new nlobjSearchFilter('custrecord_contractuser_endate', null, 'within', 'daysago7', 'daysfromnow7')
		               ];
		
		var srchRst = nlapiSearchRecord(null, 'customsearch__end_date_resolution', srchFlt);
		

		

		if(isNotEmpty(srchRst)){
			var non_free_users = [], free_users =[];
			for(var rst in srchRst){
				// build list of not free trial obj search result
				if(srchRst[rst].getValue('custrecord_contractuser_freetrial', null, 'group') == 'F'){
					non_free_users.push(srchRst[rst]);
				}else{
					free_users.push(srchRst[rst]);
				}
			}
			if(non_free_users.length > 0){
				for(var user = 0; user < non_free_users.length; user++){
						user_sublist.setLineItemValue('userlist_enddate', user+1, non_free_users[user].getValue('custrecord_contractuser_endate', null, 'group'));
						user_sublist.setLineItemValue('userlist_email', user+1, non_free_users[user].getValue('custrecord_contractuser_email', null, 'group'));
						user_sublist.setLineItemValue('userlist_items', user+1, non_free_users[user].getValue("formulatext", null, 'max'));
						user_sublist.setLineItemValue('userlist_id', user+1, non_free_users[user].getValue("internalid", null, "group"));
						user_sublist.setLineItemValue('userlist_contract', user+1, non_free_users[user].getText('custrecord_contractuser_contract', null, 'group'));
						user_sublist.setLineItemValue('userlist_company', user+1, non_free_users[user].getText('custrecord_contractuser_customer', null, 'group'));
				}
			}	
			
			if(free_users.length > 0){
				for(var freeuser = 0; freeuser < free_users.length; freeuser++){
					freeuser_sublist.setLineItemValue('freeuserlist_enddate', freeuser+1, free_users[freeuser].getValue('custrecord_contractuser_endate', null, 'group'));
					freeuser_sublist.setLineItemValue('freeuserlist_email', freeuser+1, free_users[freeuser].getValue('custrecord_contractuser_email', null, 'group'));
					freeuser_sublist.setLineItemValue('freeuserlist_items', freeuser+1, free_users[freeuser].getValue("formulatext", null, 'max'));
					freeuser_sublist.setLineItemValue('freeuserlist_id', freeuser+1, free_users[freeuser].getValue("internalid", null, "group"));
					//freeuser_sublist.setLineItemValue('freeuserlist_contract', i+1, srchRst[i].getText('custrecord_contractuser_contract', null, 'group'));
					freeuser_sublist.setLineItemValue('freeuserlist_company', freeuser+1, free_users[freeuser].getText('custrecord_contractuser_customer', null, 'group'));
				}
			}
		}
		
		
		form.addSubmitButton('Submit');
		response.writePage(form);
	}else{
		var new_enddate = request.getParameter('new_enddate');
		var userlist_len = request.getLineItemCount('user_sublist');
		var freeuser_len = request.getLineItemCount('freeuser_sublist');
		nlapiLogExecution('DEBUG', 'POST', 'new_enddate = ' + new_enddate + ', userlist_len = '+ userlist_len + ', freeuser_len = ' + freeuser_len);
		
		if(userlist_len > 0){
			for(var i = 0; i < userlist_len; i++){
				var isChecked = request.getLineItemValue('user_sublist', 'userlist_apply', i+1);
				if(isChecked == 'T'){
					try{
						var rec = nlapiLoadRecord('customrecord_contractuser', request.getLineItemValue('user_sublist', 'userlist_id', i+1)); 
						rec.setFieldValue('custrecord_contractuser_endate', new_enddate);
						var webuser_rec = nlapiSubmitRecord(rec, null, true);
						nlapiLogExecution('DEBUG', 'Submitted Web User Record', webuser_rec);
					}
					catch(e){
						nlapiLogExecution('debug', 'Error in submitting End Date', e);
					}
				}
			}
		}
		if(freeuser_len > 0){
			for(var f = 0; f < freeuser_len; f++){
				var isFreeChecked = request.getLineItemValue('freeuser_sublist', 'freeuserlist_apply', f+1);
				if(isFreeChecked == 'T'){
					try{
						var freerec = nlapiLoadRecord('customrecord_contractuser', request.getLineItemValue('freeuser_sublist', 'freeuserlist_id', f+1));
						freerec.setFieldValue('custrecord_contractuser_endate', new_enddate);
						var freeuser_rec = nlapiSubmitRecord(freerec, null, true);
						nlapiLogExecution('DEBUG', 'Submitted Free Web User Record', freeuser_rec);
					}catch(e){
						nlapiLogExecution('debug', 'Error in submitting Free User End Date', e);
					}
				}
			}
		}
		
		var card = 'CARD_-29';
		response.sendRedirect('TASKLINK', card);
	}
}

function taEndDateResolution_PageInit(type) {
	AddJavascript('https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js', 'head');
	AddStyle('https://system.na1.netsuite.com/core/media/media.nl?id=460245&c=1257021&h=1dfd9023815b08328aab&_xt=.css','head');
}

function taEndDateResolution_SaveRecord() {
	var checkCount = 0;
	var listCount = nlapiGetLineItemCount('user_sublist');
	var freeCount = nlapiGetLineItemCount('freeuser_sublist');
	for(var i =0; i < listCount; i++){
		if(nlapiGetLineItemValue('user_sublist', 'userlist_apply', i+1) == 'T'){
			checkCount++;
		}
	}
	
	for(var f = 0; f < freeCount; f++){
		if(nlapiGetLineItemValue('freeuser_sublist', 'freeuserlist_apply', f+1) == 'T'){
			checkCount++;
		}
	}
	
	
	nlapiLogExecution('debug', 'Apply Checked Count', checkCount);
	
	if(checkCount > 0){
		swal({title:'Great!', text: "Your request is in progress. You will be redirected once the process is finished.", showConfirmButton: false});
		return true;
	}else{
		swal('Error!', 'There was no user selected to process', 'error');
		return false;
	}
	
}



