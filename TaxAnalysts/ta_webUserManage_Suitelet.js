/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Oct 2015     huichanyi
 *
 */

/**
 * @param {nlobjRequest} req Request object
 * @param {nlobjResponse} res Response object
 * @returns {Void} Any output is written via response object
 */

/****************************
 *  CLIENT CODE
 *  Page Init & Save Record
 ****************************/

function clientPageInit(type){
	AddJavascript('https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js', 'head');
	AddStyle('https://system.na1.netsuite.com/core/media/media.nl?id=460245&c=1257021&h=1dfd9023815b08328aab&_xt=.css','head');

	var contractLbl = document.getElementById("custfld_contract_fs_lbl_uir_label");
	if(contractLbl){
		var container = contractLbl.parentNode;
		var gobtn = document.createElement('BUTTON');
		var text = document.createTextNode('Apply Filter');
		gobtn.appendChild(text);
		container.appendChild(gobtn);
	}
	
}

function clientSaveRecord(){
	
	var checkCount = 0;
	var listCount = nlapiGetLineItemCount('submit_user_sublist');
	var freeCount = nlapiGetLineItemCount('submit_freeuser_sublist');
	var inactiveCount = nlapiGetLineItemCount('submit_inactive_sublist');
	var expiredCount = nlapiGetLineItemCount('submit_expired_sublist');
	var newenddate = nlapiGetFieldValue('new_enddate');
	var action = nlapiGetFieldValue('user_action');
	for(var i = 0; i < listCount; i++){
		if(nlapiGetLineItemValue('submit_user_sublist', 'submit_userlist_apply', i+1) == 'T'){
			checkCount++;
		}
	}
	
	for(var f = 0; f < freeCount; f++){
		if(nlapiGetLineItemValue('submit_freeuser_sublist', 'submit_freeuserlist_apply', f+1) == 'T'){
			checkCount++;
		}
	}
	
	for(var a = 0; a < inactiveCount; a++){
		if(nlapiGetLineItemValue('submit_inactive_sublist', 'submit_inactive_apply', a+1) == 'T'){
			checkCount++;
		}
	}
	
	for(var e = 0; e < expiredCount; e++){
		if(nlapiGetLineItemValue('submit_expired_sublist', 'submit_expired_apply', e+1) == 'T'){
			checkCount++;
		}
	}
	
	nlapiLogExecution('debug', 'Apply Checked Count', checkCount);
	
	

	// if no user is selected throw error
	if(checkCount == 0 && isNotEmpty(action)){
		swal("No User Selected", "There is nothing to process here", "error");
		return false;
	}else if(isEmpty(newenddate) && action == 'a'){
		swal("End Date is Missing", "Please specify new user end date", "error");
		return false;
	}else {
		swal({title: "Processing", text: "Your request is in progress..", showConfirmButton: false });
		return true;
	}
	
}

/*************************
 * Action Button Functions
 **************************/ 

function button_action(action){
	var custId = nlapiGetFieldValue('cust_id');
	var userListLen = nlapiGetLineItemCount('user_sublist');
	var freeuserListLen = nlapiGetLineItemCount('freeuser_sublist');
	var inactiveListLen = nlapiGetLineItemCount('inactive_sublist');
	var expiredListLen = nlapiGetLineItemCount('expired_sublist');
	var userToUpdate = [];
	var freeUserToUpdate = [];
	var inactivateToUpdate = [];
	var expiredToUpdate = [];
	var contracts = nlapiGetFieldValues('custfld_contract');
	
	function pushToUpdateList(listlen, sublist, fld_prefix, update_array ) {
		for(var user = 0; user < listlen; user++){
			var isChecked = nlapiGetLineItemValue(sublist, fld_prefix + '_apply', user+1);
			if(isChecked == 'T'){
				update_array.push(parseInt(nlapiGetLineItemValue(sublist, fld_prefix+'_id', user+1)));
			}
		}
	}
	
	
	if(userListLen > 0){
		pushToUpdateList(userListLen, 'user_sublist', 'userlist', userToUpdate);
		
	}
	
	if(freeuserListLen > 0){
		pushToUpdateList(freeuserListLen, 'freeuser_sublist', 'freeuserlist', freeUserToUpdate);
	}
	
	if(inactiveListLen > 0){
		pushToUpdateList(inactiveListLen, 'inactive_sublist', 'inactive', inactivateToUpdate);
	}
	
	if(expiredListLen > 0){
		pushToUpdateList(expiredListLen, 'expired_sublist', 'expired', expiredToUpdate);
	}
	
	var url = nlapiResolveURL('SUITELET', 'customscript_webuser_management', 'customdeploy1');
	url += '&custId='+ custId +'&action='+ action +'&user_ids='+userToUpdate+'&freeuser_ids='+freeUserToUpdate+'&inactive_ids='+ inactivateToUpdate+'&expired_ids=' + expiredToUpdate+'&contracts=' + contracts;
	window.open(url, '_self', null, true);
}


function update_end_date(){
	button_action('a');
}

function inactivate_users(){
	button_action('b');
}

function activate_users() {
	button_action('c');
}

function add_items() {
	button_action('d');
}




/* ********************* *
 *     SUITELET BEGINS 
 * ********************* */


function ta_web_user_manage_suitelet(req, res){
	var custId = req.getParameter('custId');
	var contractId = req.getParameterValues('contractId');
	var action = req.getParameter('action');
	
	if(isEmpty(action) && req.getMethod() != 'POST'){
		
		// Creating UI
		
		var actionform = nlapiCreateForm('Web User Management', false);
		actionform.setScript('customscript_ta_webuser_manage_client');
		actionform.addButton('cancel', 'Cancel', 'setWindowChanged(window, false);history.back();');
		var ctrcSrcLen = 0;
		
		// adding action buttons
		actionform.addButton('custpage_update_enddate','Update End Date', 'update_end_date()');
		actionform.addButton('custpage_inactivate_user', 'Inactivate User(s)', 'inactivate_users()');
		actionform.addButton('custpage_activate_user', 'Re-activate User(s)', 'activate_users()');
		if(contractId && contractId[0] != 'reset') actionform.addButton('custpage_add_item', 'Add Items to User(s)', 'add_items()');
		
		var cust_id = actionform.addField('cust_id', 'text', 'Customer NetSuite ID').setDisplayType('inline');
		cust_id.setDefaultValue(custId);
		cust_id.setLayoutType('normal', 'startcol');
		var cust_name = actionform.addField('cust_name', 'text', 'Customer');
		cust_name.setDefaultValue(nlapiLookupField('customer', custId, 'companyname'));
		cust_name.setDisplayType('inline');
		var contractSelect = actionform.addField('custfld_contract', 'multiselect', 'Select Contract(s) [Optional]');
		contractSelect.setLayoutType('endrow', 'startcol');
		contractSelect.addSelectOption('reset', '');
		nlapiLogExecution('debug', 'custId', custId);
		// adding contract select options
			var filters = [];
			var columns = [];
			filters.push(new nlobjSearchFilter('custrecord_contracts_bill_to_customer', null, 'is', custId));
			filters.push(new nlobjSearchFilter('custrecord_contracts_end_date', null, 'onorafter','today'));
			columns.push(new nlobjSearchColumn('internalid'));
			columns.push(new nlobjSearchColumn('name'));
			var results = nlapiSearchRecord('customrecord_contracts', null, filters, columns);
			if(isNotEmpty(results)){
				ctrcSrcLen = results.length;
				for(var i = 0; i < results.length; i++){
					if(isNotEmpty(contractId)){
						if(contractId.indexOf(results[i].getId()) != -1){
							contractSelect.addSelectOption(results[i].getId(), results[i].getValue('name'), true);
						}else{
							contractSelect.addSelectOption(results[i].getId(), results[i].getValue('name'));
						}
					}else{
						contractSelect.addSelectOption(results[i].getId(), results[i].getValue('name'));
					}
				}
			}
	
		contractSelect.setDisplaySize(300, ctrcSrcLen);
		
		
		// Function to add fields to each sublist
		function add_fields_to_sublist(sublist, prefix) {
			sublist.addMarkAllButtons();
			sublist.addField(prefix + '_apply', 'checkbox', 'Apply');
			sublist.addField(prefix + '_company', 'text', 'Customer');
			sublist.addField(prefix + '_contract', 'text', 'Contract');
			sublist.addField(prefix + '_email', 'email', 'Email');
			sublist.addField(prefix + '_enddate', 'date', 'End Date');
			sublist.addField(prefix + '_items', 'textarea', 'Items');
			var webuser_id_fld = sublist.addField(prefix + '_id', 'text', 'Web User ID');
			webuser_id_fld.setDisplayType('hidden');
		}
		
		// Adding List of Web Users (non-free)
		var user_sublist = actionform.addSubList('user_sublist', 'list', 'List of Web User(s)');
		add_fields_to_sublist(user_sublist, 'userlist');

		
		// Adding List of Free Trial Users
		var freeuser_sublist = actionform.addSubList('freeuser_sublist', 'list', 'List of Free Trial User(s)');
		add_fields_to_sublist(freeuser_sublist, 'freeuserlist');

		
		// Adding List of Inactive Users
		var inactive_sublist = actionform.addSubList('inactive_sublist', 'list', 'List of Inactivated Users');
		add_fields_to_sublist(inactive_sublist, 'inactive');

		// Adding list of expired users
		var expired_sublist = actionform.addSubList('expired_sublist', 'list', 'List of Expired User(s)');
		add_fields_to_sublist(expired_sublist, 'expired');
		
		
		// search to fill in list of Web Users and Free Web Users
		
		(function() {
			var srchFlt = [
			               new nlobjSearchFilter('custrecord_contractuser_customer', null, 'is', custId)
			               ];
			if(isNotEmpty(req.getParameter('contractId'))){
				srchFlt.push(new nlobjSearchFilter('custrecord_contractuser_contract', null, 'anyof', contractId));
			}
			
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
						user_sublist.setLineItemValue('userlist_enddate', user + 1, non_free_users[user].getValue('custrecord_contractuser_endate', null, 'group'));
						user_sublist.setLineItemValue('userlist_email', user + 1, non_free_users[user].getValue('custrecord_contractuser_email', null, 'group'));
						user_sublist.setLineItemValue('userlist_items', user + 1, non_free_users[user].getValue("formulatext", null, 'max'));
						user_sublist.setLineItemValue('userlist_id', user + 1, non_free_users[user].getValue("internalid", null, "group"));
						user_sublist.setLineItemValue('userlist_contract', user + 1, non_free_users[user].getText('custrecord_contractuser_contract', null, 'group'));
						user_sublist.setLineItemValue('userlist_company', user + 1, non_free_users[user].getText('custrecord_contractuser_customer', null, 'group'));
					}
				}	
				
				if(free_users.length > 0){
					for(var freeuser = 0; freeuser < free_users.length; freeuser++){
						freeuser_sublist.setLineItemValue('freeuserlist_enddate', freeuser + 1, free_users[freeuser].getValue('custrecord_contractuser_endate', null, 'group'));
						freeuser_sublist.setLineItemValue('freeuserlist_email', freeuser + 1, free_users[freeuser].getValue('custrecord_contractuser_email', null, 'group'));
						freeuser_sublist.setLineItemValue('freeuserlist_items', freeuser + 1, free_users[freeuser].getValue("formulatext", null, 'max'));
						freeuser_sublist.setLineItemValue('freeuserlist_id', freeuser + 1, free_users[freeuser].getValue("internalid", null, "group"));
						//freeuser_sublist.setLineItemValue('freeuserlist_contract', i+1, srchRst[i].getText('custrecord_contractuser_contract', null, 'group'));
						freeuser_sublist.setLineItemValue('freeuserlist_company', freeuser + 1, free_users[freeuser].getText('custrecord_contractuser_customer', null, 'group'));
					}
				}
			}
		}());
		
		// search to fill in Inactive Users
		(function(){
			var srchFlt = [];
			srchFlt.push(new nlobjSearchFilter('custrecord_contractuser_customer', null, 'is', custId));
			if(isNotEmpty(req.getParameter('contractId'))){
				srchFlt.push(new nlobjSearchFilter('custrecord_contractuser_contract', null, 'anyof', contractId));
			}
			srchFlt.push(new nlobjSearchFilter('custrecord_contractuser_activeflag', null, 'is', 'F'));
			//srchFlt.push(new nlobjSearchFilter('custrecord_contractuser_endate', null, 'before', 'today').setOr(true));
			
			var srchCol = [];
			srchCol.push(new nlobjSearchColumn('custrecord_contractuser_endate', null, 'group'));
			srchCol.push(new nlobjSearchColumn('custrecord_contractuser_email', null, 'group'));
			srchCol.push(new nlobjSearchColumn('custrecord_contractuser_contract', null, 'group'));
			srchCol.push(new nlobjSearchColumn('custrecord_contractuser_customer', null, 'group'));
			srchCol.push(new nlobjSearchColumn('internalid', null, 'group'));
			srchCol.push(new nlobjSearchColumn('formulatext', null, 'max').setFormula('NS_CONCAT({custrecord_contractuser_items})'));
			
			var srchRst = nlapiSearchRecord('customrecord_contractuser', null, srchFlt, srchCol);
			if(isNotEmpty(srchRst)){
				for(var i = 0; i < srchRst.length; i++){
					inactive_sublist.setLineItemValue('inactive_enddate', i + 1, srchRst[i].getValue('custrecord_contractuser_endate', null, 'group'));
					inactive_sublist.setLineItemValue('inactive_email', i + 1, srchRst[i].getValue('custrecord_contractuser_email', null, 'group'));
					inactive_sublist.setLineItemValue('inactive_items', i + 1, srchRst[i].getValue("formulatext", null, 'max'));
					inactive_sublist.setLineItemValue('inactive_id', i + 1, srchRst[i].getValue("internalid", null, "group"));
					inactive_sublist.setLineItemValue('inactive_contract', i + 1, srchRst[i].getText('custrecord_contractuser_contract', null, 'group'));
					inactive_sublist.setLineItemValue('inactive_company', i + 1, srchRst[i].getText('custrecord_contractuser_customer', null, 'group'));
				}
			}
		}());
		
		// search to fill in expired users 
		(function(){
			var srchFlt = [];
			srchFlt.push(new nlobjSearchFilter('custrecord_contractuser_customer', null, 'is', custId));
			if(isNotEmpty(req.getParameter('contractId'))){
				srchFlt.push(new nlobjSearchFilter('custrecord_contractuser_contract', null, 'anyof', contractId));
			}
			srchFlt.push(new nlobjSearchFilter('custrecord_contractuser_activeflag', null, 'is', 'T'));
			srchFlt.push(new nlobjSearchFilter('custrecord_contractuser_endate', null, 'before', 'today'));
			srchFlt.push(new nlobjSearchFilter('custrecord_contractuser_email', null, 'isnotempty'));
			var srchCol = [];
			srchCol.push(new nlobjSearchColumn('custrecord_contractuser_endate', null, 'group'));
			srchCol.push(new nlobjSearchColumn('custrecord_contractuser_email', null, 'group'));
			srchCol.push(new nlobjSearchColumn('custrecord_contractuser_contract', null, 'group'));
			srchCol.push(new nlobjSearchColumn('custrecord_contractuser_customer', null, 'group'));
			srchCol.push(new nlobjSearchColumn('internalid', null, 'group'));
			srchCol.push(new nlobjSearchColumn('formulatext', null, 'max').setFormula('NS_CONCAT({custrecord_contractuser_items})'));
			
			var srchRst = nlapiSearchRecord('customrecord_contractuser', null, srchFlt, srchCol);
			if(isNotEmpty(srchRst)){
				for(var i = 0; i < srchRst.length; i++){
					expired_sublist.setLineItemValue('expired_enddate', i + 1, srchRst[i].getValue('custrecord_contractuser_endate', null, 'group'));
					expired_sublist.setLineItemValue('expired_email', i + 1, srchRst[i].getValue('custrecord_contractuser_email', null, 'group'));
					expired_sublist.setLineItemValue('expired_items', i + 1, srchRst[i].getValue("formulatext", null, 'max'));
					expired_sublist.setLineItemValue('expired_id', i + 1, srchRst[i].getValue("internalid", null, "group"));
					expired_sublist.setLineItemValue('expired_contract', i + 1, srchRst[i].getText('custrecord_contractuser_contract', null, 'group'));
					expired_sublist.setLineItemValue('expired_company', i + 1, srchRst[i].getText('custrecord_contractuser_customer', null, 'group'));
				}
			}
		}());
		
		res.writePage(actionform);
		

	}
	/********************************************/
	//              Action is Set 
	//            Confirmation Page
	/********************************************/
	
	else if(isNotEmpty(action) && req.getMethod() != 'POST'){
		
		var webuser_ids = req.getParameter('user_ids');
		var freeuser_ids = req.getParameter('freeuser_ids');
		var inactive_ids = req.getParameter('inactive_ids');
		var expired_ids = req.getParameter('expired_ids');
		var contracts = req.getParameter('contracts');
	
		if(isNotEmpty(webuser_ids)) webuser_ids = webuser_ids.split(',');
		if(isNotEmpty(freeuser_ids)) freeuser_ids = freeuser_ids.split(',');
		if(isNotEmpty(inactive_ids)) inactive_ids = inactive_ids.split(',');
		if(isNotEmpty(expired_ids)) expired_ids = expired_ids.split(',');
		if(contracts) contracts = contracts.split(',');
		
		nlapiLogExecution('DEBUG', 'contracts', JSON.stringify(contracts));
		var submitform = nlapiCreateForm('Please review before submitting the form', false);
		submitform.setScript('customscript_ta_webuser_manage_client');
		submitform.addFieldGroup('custpage_options', 'Review following information.');
		var actionFld = submitform.addField('user_action', 'select', 'Confirm your action to be performed', null, 'custpage_options');
		actionFld.addSelectOption('a', 'Extend End Date');
		actionFld.addSelectOption('b', 'Inactivate User(s)');
		actionFld.addSelectOption('c', 'Re-activate User(s)');
		actionFld.addSelectOption('d', 'Add Item(s) to Users(s)');
		actionFld.setDefaultValue(action);
		actionFld.setDisplayType('inline');
		actionFld.setLayoutType('startrow', 'startcol');
		
		var cust_id = submitform.addField('cust_id', 'text', 'Customer Id', null, 'custpage_options');
		cust_id.setDisplaySize(10);
		cust_id.setDisplayType('inline');
		cust_id.setDefaultValue(custId);
		
		var cust_name = submitform.addField('submit_cust_name', 'text', 'Customer Name');
		cust_name.setDefaultValue(nlapiLookupField('customer', custId, 'companyname'));
		cust_name.setDisplayType('inline');
		


		// setting lines of the user to be updated.
		
		// function to set user list *********************************************************************************************************
		function setSubListValue(user_ids, sublist, sublist_str ) {
			try{
				var srchFlt = [];
				var srchRst;
				srchFlt.push(new nlobjSearchFilter('internalid', null, 'anyof', user_ids));
				srchFlt.push(new nlobjSearchFilter('custrecord_contractuser_customer', null, 'is', custId));
				if(user_ids == inactive_ids){
					srchRst = nlapiSearchRecord('customrecord_contractuser', 'customsearch__end_date_resolution_2', srchFlt);
				}
				else{
					srchRst = nlapiSearchRecord('customrecord_contractuser', 'customsearch__end_date_resolution', srchFlt);
				}
				if(isNotEmpty(srchRst)){
					for(var i = 0 ; i < srchRst.length; i++){
						sublist.setLineItemValue(sublist_str + '_apply', i+1, 'T');
						sublist.setLineItemValue(sublist_str + '_enddate', i+1, srchRst[i].getValue('custrecord_contractuser_endate', null, 'group'));
						sublist.setLineItemValue(sublist_str + '_company', i+1, srchRst[i].getText('custrecord_contractuser_customer', null, 'group'));
						sublist.setLineItemValue(sublist_str + '_contract', i+1, srchRst[i].getText('custrecord_contractuser_contract', null, 'group'));
						sublist.setLineItemValue(sublist_str + '_email', i+1, srchRst[i].getValue('custrecord_contractuser_email', null, 'group'));
						sublist.setLineItemValue(sublist_str + '_items', i+1, srchRst[i].getValue('formulatext', null, 'max'));
						sublist.setLineItemValue(sublist_str + '_id', i+1, srchRst[i].getValue('internalid', null, 'group'));
					}
				}
			}
			catch(e){
				throw 'Error in processing your request. Please make sure at least one user is checked from the list' + e;
			}
		}
		//***************************************************************************************************************************************
		
		
		if(isNotEmpty(webuser_ids)){
			
			// Adding List of Web Users (non-free)
			var user_sublist = submitform.addSubList('submit_user_sublist', 'list', 'List of Web User(s) will be affected');
			
			var submit_user_apply = user_sublist.addField('submit_userlist_apply', 'checkbox', 'Apply');
			//submit_user_apply.setDisplayType('disabled');
			user_sublist.addField('submit_userlist_company', 'text', 'Customer');
			user_sublist.addField('submit_userlist_contract', 'text', 'Contract');
			user_sublist.addField('submit_userlist_email', 'email', 'Email');
			user_sublist.addField('submit_userlist_enddate', 'date', 'End Date');
			user_sublist.addField('submit_userlist_items', 'textarea', 'Items');
			var webuser_id_fld = user_sublist.addField('submit_userlist_id', 'text', 'Web User ID');
			//webuser_id_fld.setDisplayType('hidden');
			
			// set users list for regular webusers
			setSubListValue(webuser_ids, user_sublist, 'submit_userlist');
		}
		
		if(isNotEmpty(freeuser_ids)){
			
			// Adding List of Free Trial Users
			var freeuser_sublist = submitform.addSubList('submit_freeuser_sublist', 'list', 'List of Free Trial User(s) will be affected');
			
			var freeuser_apply = freeuser_sublist.addField('submit_freeuserlist_apply', 'checkbox', 'Apply');
			//freeuser_apply.setDisplayType('disabled');
			freeuser_sublist.addField('submit_freeuserlist_company', 'text', 'Customer');
			freeuser_sublist.addField('submit_freeuserlist_contract', 'text', 'Contract');
			freeuser_sublist.addField('submit_freeuserlist_email', 'email', 'Email');
			freeuser_sublist.addField('submit_freeuserlist_enddate', 'date', 'End Date');
			freeuser_sublist.addField('submit_freeuserlist_items', 'textarea', 'Items');
			var freeuser_id_fld = freeuser_sublist.addField('submit_freeuserlist_id', 'text', 'Web User ID');
			
			// set user list for free trial webusers
			setSubListValue(freeuser_ids, freeuser_sublist, 'submit_freeuserlist');
		}
		
		if(isNotEmpty(inactive_ids)){
			// create sublist of inactives 
			var inactive_sublist = submitform.addSubList('submit_inactive_sublist', 'list', 'List of Inactivated User(s) will be affected');
			
			var submit_inactive_apply = inactive_sublist.addField('submit_inactive_apply', 'checkbox', 'Apply');
			//submit_inactive_apply.setDisplayType('disabled');
			inactive_sublist.addField('submit_inactive_company', 'text', 'Customer');
			inactive_sublist.addField('submit_inactive_contract', 'text', 'Contract');
			inactive_sublist.addField('submit_inactive_email', 'email', 'Email');
			inactive_sublist.addField('submit_inactive_enddate', 'date', 'End Date');
			inactive_sublist.addField('submit_inactive_items', 'textarea', 'Items');
			inactive_sublist.addField('submit_inactive_id', 'text', 'Web User ID');
			
			// set user list for inactive users
			setSubListValue(inactive_ids, inactive_sublist, 'submit_inactive');
		}
		
		if(isNotEmpty(expired_ids)){
			// create sublist of inactives 
			var expired_sublist = submitform.addSubList('submit_expired_sublist', 'list', 'List of Expired User(s) will be affected');
			
			var submit_expired_apply = expired_sublist.addField('submit_expired_apply', 'checkbox', 'Apply');
			//submit_expired_apply.setDisplayType('disabled');
			expired_sublist.addField('submit_expired_company', 'text', 'Customer');
			expired_sublist.addField('submit_expired_contract', 'text', 'Contract');
			expired_sublist.addField('submit_expired_email', 'email', 'Email');
			expired_sublist.addField('submit_expired_enddate', 'date', 'End Date');
			expired_sublist.addField('submit_expired_items', 'textarea', 'Items');
			expired_sublist.addField('submit_expired_id', 'text', 'Web User ID');
			
			// set user list for inactive users
			setSubListValue(expired_ids, expired_sublist, 'submit_expired');
		}
		
		// if action is 'a' (extend end date) then display date field
		if(action == 'a'){
			var new_enddate = submitform.addField('new_enddate', 'date', 'Specify User\'s New End Date', null, 'custpage_options');
			new_enddate.setLayoutType('endrow', 'startcol').setMandatory(true);
		}
		
		// When action is 'd' make available Item Select Field

		if(action == 'd') {
			
			var items_select = submitform.addField('items_to_add', 'multiselect', 'Item(s) to add', null, 'custpage_options');
			items_select.setLayoutType('endrow', 'startcol').setMandatory(true);
			var item_select_filters = [];
			item_select_filters.push(new nlobjSearchFilter('custrecord_ci_contract_id', null, 'anyof', contracts));
			item_select_filters.push(new nlobjSearchFilter('custitem_ta_isonline', 'custrecord_ci_item', 'is', 'T'));
			var item_select_cols = [new nlobjSearchColumn('custrecord_ci_item')];
			var item_select_results = nlapiSearchRecord('customrecord_contract_item', null, item_select_filters, item_select_cols);
			
			if(isNotEmpty(item_select_results)) {
				for( var r = 0; r < item_select_results.length; r += 1) {
					items_select.addSelectOption(item_select_results[r].getValue('custrecord_ci_item'), item_select_results[r].getText('custrecord_ci_item'));
				}
			}
		}
		
		
		// rendering the form
		submitform.addSubmitButton('Submit');
		submitform.addButton('back', 'Back', 'setWindowChanged(window, false);history.back();');
		res.writePage(submitform);
	}
	
	
	
	
	/* **************************** *
	 *          POST BEGINS
	/* **************************** */
	
	if(req.getMethod() == 'POST'){
		var contract_id = req.getParameterValues('custfld_contract');
		var cust_id = req.getParameter('cust_id');
		var items_to_add = req.getParameterValues('items_to_add');
		
		nlapiLogExecution('DEBUG', 'POST Begins', JSON.stringify(items_to_add));
		if(contract_id){
			var parameters = [];
			parameters['custId'] = cust_id;
			parameters['contractId'] = (contract_id == 'reset') ?  '':contract_id;
			nlapiSetRedirectURL('SUITELET', 'customscript_webuser_management', 'customdeploy1', false, parameters);
		}
		else{
			
			// function to update enddate///////////////////////////////////////////////////////
			function update_Enddate(userlist_len ,sublist, sublist_apply, sublist_id, new_enddate) {
				for(var i = 0; i < userlist_len; i++){
					var isChecked = request.getLineItemValue(sublist, sublist_apply, i+1);
					if(isChecked == 'T'){
						try{
							var rec = nlapiLoadRecord('customrecord_contractuser', request.getLineItemValue(sublist, sublist_id, i+1)); 
							rec.setFieldValue('custrecord_contractuser_endate', new_enddate);
							nlapiSubmitRecord(rec, null, true);
							nlapiLogExecution('DEBUG', 'Submitted Web User Record', rec);
						}
						catch(e){
							nlapiLogExecution('debug', 'Error in extending End Date', e);
						}
					}
				}
			}	
			
			
			// function to set user to inactivate or activate /////////////////////////////////////////
			
			function update_User_Action(userlist_len, sublist, sublist_apply, user_id, action) {
				for(var i = 0; i < userlist_len; i++){
					var isChecked = req.getLineItemValue(sublist, sublist_apply, i+1);
					if(isChecked == 'T'){
						try{
							var rec = nlapiLoadRecord('customrecord_contractuser', req.getLineItemValue(sublist, user_id, i+1)); 
							rec.setFieldValue('custrecord_contractuser_activeflag', action);
							nlapiSubmitRecord(rec, null, true);
							nlapiLogExecution('DEBUG', 'Inactivated Web User Record', rec);
						}
						catch(e){
							nlapiLogExecution('debug', 'Error in inactivating the user(s)', e);
						}
					}
				}
			}
			
			// function to add item
			
			
			// if contract_id is empty then process actions
			var userlist_len = request.getLineItemCount('submit_user_sublist');
			var freeuser_len = request.getLineItemCount('submit_freeuser_sublist');
			var inactive_len = request.getLineItemCount('submit_inactive_sublist');
			var expired_len = request.getLineItemCount('submit_expired_sublist');
			// if action = 'a'  
			if(req.getParameter('user_action') == 'a'){
				// extend the end date of the selected user(s)

				var new_enddate = request.getParameter('new_enddate');

				nlapiLogExecution('DEBUG', 'POST', 'new_enddate = ' + new_enddate + ', userlist_len = '+ userlist_len + ', freeuser_len = ' + freeuser_len);
				
				if(userlist_len > 0){
					update_Enddate(userlist_len, 'submit_user_sublist', 'submit_userlist_apply','submit_userlist_id', new_enddate);
				}
				if(freeuser_len > 0){
					update_Enddate(freeuser_len, 'submit_freeuser_sublist', 'submit_freeuserlist_apply', 'submit_freeuserlist_id', new_enddate);
				}
				if(expired_len > 0) {
					update_Enddate(expired_len, 'submit_expired_sublist', 'submit_expired_apply', 'submit_expired_id', new_enddate);
				}
				
				res.sendRedirect('RECORD', 'customer', cust_id, false);
			
			}
			
			// if action = 'b' inactivate users
			else if(req.getParameter('user_action') == 'b'){
				if(userlist_len > 0){
					update_User_Action(userlist_len, 'submit_user_sublist', 'submit_userlist_apply', 'submit_userlist_id', 'F');
				}
				if(freeuser_len > 0){
					update_User_Action(freeuser_len, 'submit_freeuser_sublist', 'submit_freeuserlist_apply', 'submit_freeuserlist_id', 'F');
				}
				if(inactive_len > 0){
					update_User_Action(inactive_len, 'submit_inactive_sublist', 'submit_inactive_apply', 'submit_inactive_id', 'F');
				}
				if(expired_len > 0){
					update_User_Action(expired_len, 'submit_expired_sublist', 'submit_expired_apply', 'submit_expired_id', 'F');
				}
				res.sendRedirect('RECORD', 'customer', cust_id, false);
				
			}
			
			// if action is c then activate the users
			else if(req.getParameter('user_action') == 'c'){
				if(userlist_len > 0){
					update_User_Action(userlist_len, 'submit_user_sublist', 'submit_userlist_apply', 'submit_userlist_id', 'T');
				}
				if(freeuser_len > 0){
					update_User_Action(freeuser_len, 'submit_freeuser_sublist', 'submit_freeuserlist_apply', 'submit_freeuserlist_id', 'T');
				}
				if(inactive_len > 0){
					update_User_Action(inactive_len, 'submit_inactive_sublist', 'submit_inactive_apply', 'submit_inactive_id', 'T');
				}
				if(expired_len > 0){
					update_User_Action(expired_len, 'submit_expired_sublist', 'submit_expired_apply', 'submit_expired_id', 'T');
				}
				res.sendRedirect('RECORD', 'customer', cust_id, false);
				
			}
			
			// if action is d then add the items 
			else if(req.getParameter('user_action') == 'd') {
				if(userlist_len > 0 && items_to_add) {
					
					for(var i = 1; i <= userlist_len; i += 1){
						try {
							var isChecked = request.getLineItemValue('submit_user_sublist', 'submit_userlist_apply', i);
							if(isChecked == 'T') {
								var webuser_id = request.getLineItemValue('submit_user_sublist', 'submit_userlist_id', i);
								var webuser_rec = nlapiLoadRecord('customrecord_contractuser', webuser_id);
								var prev_items = webuser_rec.getFieldValues('custrecord_contractuser_items');
								var new_items = prev_items.concat(items_to_add);
								nlapiLogExecution('DEBUG', 'new_items', new_items);
								webuser_rec.setFieldValues('custrecord_contractuser_items', new_items);
								nlapiSubmitRecord(webuser_rec);
								res.sendRedirect('RECORD', 'customer', cust_id, false);
							}
						}
						catch(e) {
							throw 'Something went wrong. Please contact your admin. Error : ' + e;
						}
				
					}	
				}
			}
		}
	}
}
