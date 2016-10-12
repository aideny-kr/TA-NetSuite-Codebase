/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Apr 2016     Chan
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
/**
 * @param request
 * @param response
 * @returns {Void}
 */
function suitelet(request, response){
	var cust_id = request.getParameter('cust_id');
	var context = nlapiGetContext();
	
	if(request.getMethod() == 'GET') {
	// Creating UI 
		var form = nlapiCreateForm('Add Web User(s)');
		form.setScript('customscript_cic_add_user_client');
		form.addSubmitButton('Process Now');
		form.addResetButton('Reset');
		form.addButton('cust_btn_cancel', 'Cancel', 'setWindowChanged(window, false); history.back();');
		// Add Subtab and Sublist to add list of new users
		form.addSubTab('new_user_tab', 'New User(s) to be Added');
		var new_user_sublist = form.addSubList('new_user_sublist', 'inlineeditor', 'User(s) to be added', 'new_user_tab');
		new_user_sublist.addField('new_user_email', 'email', 'User Email');
		new_user_sublist.addField('new_user_fname', 'text', 'First Name');
		new_user_sublist.addField('new_user_lname', 'text', 'Last Name');
		
		// Main Field Group 
		form.addFieldGroup('main_fld_grp', 'Items');
		
		// Get Customer Number and Name 
		var cust_infos = nlapiLookupField('customer', cust_id, ['entityid', 'companyname']);
		var cust_name = '';
		for (fld in cust_infos) {
			if(cust_infos[fld]) cust_name += cust_infos[fld] + ' ';
		} 
		
		// Customer ID in Inline
		form.addField('cust_name_field', 'text', 'Customer Name', null, 'main_fld_grp').setDisplayType('inline').setDefaultValue(cust_name);
		var cust_id_fld = form.addField('cust_id_fld', 'text', 'Customer ID', null, 'main_fld_grp').setDisplayType('inline').setDefaultValue(cust_id);
		

		
		// SSO/IP Email Option Field 
		
		
		// Add available contract items as multi-select field.
		var item_select_fld = form.addField('item_select_fld', 'multiselect', 'Item(s)', null, 'main_fld_grp').setBreakType('startcol').setDisplaySize(400, 6);
		
		// Gets the available contract items list 
		var contract_items = taGetContractItems(cust_id);
		
		// Sets the list as options for item_select
		taSetItemOptions(contract_items, item_select_fld);
		
		form.addFieldGroup('option_fld_grp', 'Other Options');
		form.addField('email_check', 'checkbox', 'Suppress Welcome Email', null, 'option_fld_grp').setDisplaySize(400,1).setDefaultValue('F');
		var user_type_select_fld = form.addField('user_type_fld', 'select', 'User Type', null, 'option_fld_grp');
		user_type_select_fld.addSelectOption('regular', 'Regular', true);
		user_type_select_fld.addSelectOption('sso', 'SSO');
		user_type_select_fld.addSelectOption('ip', 'IP');
		// Write Page UI 
		response.writePage(form);
	}

	/* *
	 * Suitelet POST  
	 *
	 * */
	else {
		/**
		JSON to pass
		{
        "contactId": "123",
        "email": "best@info.com",
        "company": "248",
        "SSO": "T/F",
        "IP": T/F,
        "emailOption": "1/2/3",
			"CICinfo": [{
				"contractItemId": "1234",
				"itemid": "1055",
				"contractItemId": "123",
				"contractId": "3333",
				"enddate": "11 / 30 / 16",
				"freetrial": "T / F",
			}, 
			{
				"contractItemId": "1235",
				"itemid": "1056",
				"contractItemId": "123",
				"contractId": "3333",
				"enddate": "11 / 30 / 16",
				"freetrial": "T / F",
			}]
		}
		***/
		
		// Getting Parameters to get values 
		nlapiLogExecution('DEBUG', 'POST Begins...');
		
		var contract_items = request.getParameterValues('item_select_fld');
		var new_user_len = request.getLineItemCount('new_user_sublist');
		var cust_id = request.getParameter('cust_id_fld');
		var user_type = request.getParameter('user_type_fld');
		//user_type = user_type == '1' ? 'Regular': user_type == '2' ? 'SSO' : user_type == '3' ? 'IP' : '';
		var email_option = request.getParameter('email_check');
		var contact_id = '';
		var email, firstname, lastname;
		var FIELDS_LOOKUP = ['custrecord_ci_item', 'custrecord_ci_contract_id', 'custrecord_ci_enddate'];
		

		// create CIC record and Submit to Drupal
		// if the list is less than 25 people
		if (new_user_len > 0 && new_user_len <= 2) {
			
			for (var i = 1; i <= new_user_len; i += 1) {
				var err = new Object();
				var JSON_TO_DRUPAL = {};
				email = request.getLineItemValue('new_user_sublist', 'new_user_email', i);
				firstname = request.getLineItemValue('new_user_sublist', 'new_user_fname', i);
				lastname = request.getLineItemValue('new_user_sublist', 'new_user_lname', i);
				contact_id = taGetContactId(email, cust_id) || taCreateContact(email, firstname, lastname, cust_id);
				
				// Assign necessary property values
				JSON_TO_DRUPAL.action = 'create';
				JSON_TO_DRUPAL.id_contact = contact_id;
				JSON_TO_DRUPAL.usertype = user_type;
				JSON_TO_DRUPAL.email = email;
				JSON_TO_DRUPAL.emailOption = email_option == 'T' ? 'suppress' : ''; 
				JSON_TO_DRUPAL.id_customer = cust_id;
				JSON_TO_DRUPAL.items = [];
				
				
				if (typeof contract_items !== 'undefined') {
					for( var x = 0; x < contract_items.length; x += 1 ) {
						var contract_id_info = nlapiLookupField('customrecord_contract_item', contract_items[x], FIELDS_LOOKUP);
						var duplicate_check = false;
						
						// !TA Library function to check duplicate CIC
						if(!taCheckDuplicateCic(contact_id, contract_id_info['custrecord_ci_item'])) {
							duplicate_check = true;
						}
						// If duplicate record is found fill out the error object.
						else {
							err.context = "Duplicate Record Found";
							err.detail = "There was a user with the exact same item. \n" 
								+ "Skipping Email : " + email + ", for Item : " + contract_id_info['custrecord_ci_item'] + "\n"
								+ "Proceeding to next request.";
						}
						
						// If the request is valid then create the user
						if(duplicate_check) {
							// create CIC record  
							var cic_rec = nlapiCreateRecord('customrecord_cic');
							cic_rec.setFieldValue('custrecord_cic_company', cust_id);
							cic_rec.setFieldValue('custrecord_cic_contract', contract_id_info['custrecord_ci_contract_id']);
							cic_rec.setFieldValue('custrecord_cic_contact', contact_id);
							cic_rec.setFieldValue('custrecord_cic_contract_item', contract_items[x]);
							
							try {
								var cic_id = nlapiSubmitRecord(cic_rec, true, true);
							} 
							catch(e) {
								nlapiLogExecution('ERROR', 'Erroe Message', e);
								err.context = 'Failed to Create a User';
								err.detail = e; 
							}
							
							// after cic_rec is submitted successfully, 
							// build JSON and push into JSON_TO_DRUPAL.items
							if(cic_id) {
								var itemId = contract_id_info[FIELDS_LOOKUP[0]];
								JSON_TO_DRUPAL.items.push({
									item_id: cic_id, 
									role_id: nlapiLookupField('item', itemId, 'type') === 'Kit' ? taGetKitMember(itemId) : itemId,
									id_contract: contract_id_info[FIELDS_LOOKUP[1]],
									enddate: contract_id_info[FIELDS_LOOKUP[2]],
									freetrial: 'F'
								});	
							}
						
						}
						// Notify the user if there was any error during the process
						if(typeof err.context !== 'undefined') { 
							var message = '';
							message += err.detail + '\n';
						
							nlapiSendEmail('8100', context.getUser(), err.context, message, 'chan.yi@taxanalysts.org');
						
						}
					}
					
					// Sending JSON_TO_DRUPAL to Drupal
					// if there is any item in JSON_TO_DRUPAL.items
					if (JSON_TO_DRUPAL.items.length > 0) {
						
						var url = taGetRequestURL();
						var headers = {};
						headers['User-Agent-x'] = 'SuiteScript-Call';
						headers['Content-Type'] = 'application/json';
						
						// Getting response from Drupal after submitting JSON_TO_DRUPAL
						var response = nlapiRequestURL(url, JSON.stringify(JSON_TO_DRUPAL), headers);
						
						// Validate response
						nlapiLogExecution('DEBUG', 'response body',response.getBody());
						nlapiLogExecution('DEBUG', 'response code',response.getCode());
					}
					
				}
				
				nlapiLogExecution('DEBUG', 'JSON', JSON.stringify(JSON_TO_DRUPAL));
				nlapiLogExecution('DEBUG', 'Remaining Usage', context.getRemainingUsage());
			}
		}
		// add new user JSON and pass to scheduled script 
		// IMPORTANT: This number was set for testing purpose. You must change the number before releasing.
		else if (new_user_len > 2) {
			// data_out will be sent to TA CIC SCHED script
			var data_out = [];
			for (var i = 1; i <= new_user_len; i += 1) {
				email = request.getLineItemValue('new_user_sublist', 'new_user_email', i);
				firstname = request.getLineItemValue('new_user_sublist', 'new_user_fname', i);
				lastname = request.getLineItemValue('new_user_sublist', 'new_user_lname', i);
				var json_to_push = {};
				contact_id = taGetContactId(email, cust_id) || taCreateContact(email, firstname, lastname, cust_id);
				//nlapiLogExecution('DEBUG', 'Contact ID', JSON.stringify(contact_id));
				json_to_push.usertype = user_type;
				json_to_push.email = email;
				json_to_push.id_contact = contact_id;
				json_to_push.id_customer = cust_id;
				json_to_push.email_option = email_option;
				json_to_push.cic_items = [];
				
				// iterate each contract items and get necessary information
				if(contract_items) {
					//nlapiLogExecution('DEBUG', 'List of Contract Items', JSON.stringify(contract_items));
					/* 
					  "contractItemId": "1234",
					  "itemid": "1055",
					  "contractItemId": "123",
					  "contractId": "3333",
					  "enddate": "11 / 30 / 16"
					*/
					
					_.forEach(contract_items, function(item, key) {
						var cic_item = {};
						var cont_item_values = nlapiLookupField('customrecord_contract_item', item, FIELDS_LOOKUP); 
						cic_item.contract_item_id = item;
						cic_item.item_id = cont_item_values[FIELDS_LOOKUP[0]];
						cic_item.contract_id = cont_item_values[FIELDS_LOOKUP[1]];
						cic_item.end_date = cont_item_values[FIELDS_LOOKUP[2]];
						json_to_push.cic_items.push(cic_item);
						//nlapiLogExecution('DEBUG', 'CIC_ITEM', JSON.stringify(cic_item));
					});
					
					
				}
				data_out.push(json_to_push);
			}
			nlapiLogExecution('DEBUG', 'Final JSON', JSON.stringify(data_out));
			// Make JSON and queue to Scheduled Script
			var obj_param = [];
			obj_param['custscript_user_obj'] = JSON.stringify(data_out);
			nlapiScheduleScript('customscript_ta_cic_sched', 'customdeploy1', obj_param);
			
			// Set Redirect to Status page for users to check the status of script.
			var redirect_params = {};
			redirect_params['primarykey'] = '1584';
			redirect_params['date'] = 'TODAY';
			redirect_params['scripttype'] = '252';
			nlapiSetRedirectURL('TASKLINK', 'LIST_SCRIPTSTATUS', null, null, redirect_params);
		}
		

	}
	

}
