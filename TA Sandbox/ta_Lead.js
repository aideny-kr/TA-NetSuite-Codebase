/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 Oct 2014     michaelb
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */

function lead_BeforeLoad(type, form, request){
	if (type == 'view' || type == 'edit'){
		//form.addButton('test_button','Hello','test');
		form.setScript('customscript_ta_customer_client');
		//form.getSubList('recmachcustrecord_contractuser_customer')?form.getSubList('recmachcustrecord_contractuser_customer').addButton('custpage_updatecontractusers_btn','Update Web Users','updateContractUsers_Btn()'):null;
		//form.getSubList('recmachcustrecord_contractuser_customer').addButton('custpage_webuserassistant_btn', 'Web User Assistant', 'triggerWebUserSuitelet()');
		var webuser_sublist = form.getSubList('recmachcustrecord_contractuser_customer')

		if(isNotEmpty(webuser_sublist)){
			webuser_sublist.addButton('custpage_freetrialimport_btn', 'Create Free Trial Users', 'triggerFreeTrialSuitelet()');
		}	
	}	
}

function triggerFreeTrialSuitelet() {
	var custId = nlapiGetRecordId();
	var url = nlapiResolveURL('SUITELET', 'customscript_ta_freetrial_suitelet', 'customdeploy1');
	url += '&custId='+custId;
	window.open(url, '_self');
}

function ta_lead_field_changed(type, name, linenum){
	if (name == 'custentity_ta_entity_status') {
		var taval = nlapiGetFieldValue('custentity_ta_entity_status');
//		alert(taval);
		if (taval == 1) {
			nlapiSetFieldValue('entitystatus',125);
		}
		else if (taval==2) {
			nlapiSetFieldValue('entitystatus',124);
		}
		else if (taval==3) {
			nlapiSetFieldValue('entitystatus',123);//Change to 123 in Production
		}
		else if (taval==4 || taval == 7 || taval == 8) {
			nlapiSetFieldValue('entitystatus',6);
		}
		else if (taval==5) {
			nlapiSetFieldValue('entitystatus',138);
		}
		else if (taval==6){
			nlapiSetFieldValue('entitystatus',139);
		}

	}
}

function Lead_BeforeSubmit(type){
	var context = nlapiGetContext();
	var executionContext = context.getExecutionContext();
	var userId = nlapiGetUser();
	nlapiLogExecution('debug', 'Lead_BeforeSubmit User', userId);
	nlapiLogExecution('debug', 'Lead_BeforeSubmit type', type);
	nlapiLogExecution('DEBUG', 'Lead_BeforeSubmit executionContext', executionContext);
	var leadsource = nlapiGetFieldValue('leadsource');
	var email = nlapiGetFieldValue('email');
	var industry = nlapiGetFieldValue('custentity_esc_industry');
	var CORP_SALES_REPS_1 = ['17818', '19383', '46408'];
	var CORP_SALES_REPS_2 = ['17818', '19383'];
	nlapiLogExecution('DEBUG', 'Leadsource', leadsource);
	
	// FUNCTION 
	function setNextCorpLeadAssignee(curr_index, curr_round) {
		curr_round === '1' ?
			nlapiSubmitField('employee', CORP_SALES_REPS_1[curr_index], 'custentity_ta_next_lead_assignee', 'F') :
			nlapiSubmitField('employee', CORP_SALES_REPS_2[curr_index], 'custentity_ta_next_lead_assignee', 'F');
		
		if (curr_round === '1'){	
			// Move to Next Round if last person from CORP_SALES_REPS_1 was assigned
			if(curr_index > -1 && curr_index === CORP_SALES_REPS_1.length - 1) {
				nlapiSubmitField('customrecord_ta_corp_round_robin', '1', 'custrecord_crr_round', '2');
				nlapiSubmitField('employee', CORP_SALES_REPS_2[0], 'custentity_ta_next_lead_assignee', 'T');
			} else if(curr_index > -1 && curr_index !== CORP_SALES_REPS_1.length -1) {
				nlapiSubmitField('employee', CORP_SALES_REPS_1[curr_index + 1], 'custentity_ta_next_lead_assignee', 'T');
			}
		} else {
			if(curr_index > -1 && curr_index === CORP_SALES_REPS_2.length -1) {
				nlapiSubmitField('customrecord_ta_corp_round_robin', '1', 'custrecord_crr_round', '1');
				nlapiSubmitField('employee', CORP_SALES_REPS_1[0], 'custentity_ta_next_lead_assignee', 'T');
			}else if(curr_index > -1 && curr_index !== CORP_SALES_REPS_1.length -1) {
				nlapiSubmitField('employee', CORP_SALES_REPS_2[curr_index + 1], 'custentity_ta_next_lead_assignee', 'T');
			}
		}
	}
	
	if (type == 'create'){
		// Industry is Corporate
		if(industry && industry === '39') {
			var filter = [ new nlobjSearchFilter('custentity_ta_next_lead_assignee', '', 'is', 'T') ];
			var salesrep = nlapiSearchRecord('employee', '', filter)[0].getId() || '17818';
			var round = nlapiLookupField('customrecord_ta_corp_round_robin', '1', 'custrecord_crr_round');
			nlapiSetFieldValue('salesrep', salesrep);
			// Handle Round 1
			if(round === '1') {
				var curr_index = CORP_SALES_REPS_1.indexOf(salesrep);
				setNextCorpLeadAssignee(curr_index, round);
			} else if(round === '2') {
				var curr_index = CORP_SALES_REPS_2.indexOf(salesrep);
				setNextCorpLeadAssignee(curr_index, round);
			}
		} 
		
		// run this script when execution is "webstore"
		if(executionContext === 'webstore') {
			nlapiSetFieldValue('isinactive', 'F', true);
		}
		
        nlapiSetFieldValue('custentity_uplift_type',6);
//        if(isNotEmpty(userId)){
//        	// if userId is 54452, this means the lead is being created by Bedrock Data
//        	if(userId == '54452'){
//        		// sets leadsource as hubspot 
//        		nlapiSetFieldValue('leadsource', '69128');
//        		// sets sales rep via round robin
//        		nlapiSetFieldValue("salesrep", "-202");
//        	}
//        }
        if(leadsource == '-6'){
        	// if leadsource is Web the lead is from contact us
        	// sets sales rep as blank.
        	nlapiSetFieldValue('salesrep', '');
        }
        
		
		/**
		/* on creation if email has been used to create lead/prospect mark the record as inactive
		*/
        nlapiLogExecution('DEBUG', 'Before Submit', 'Email = ' + email);
        if(leadAlreadyCreated(email)) { 
        	nlapiSetFieldValue('isinactive', 'T', false, false); 
        	nlapiSetFieldValue('salesrep', '');
        }
	}
	if(type == 'create' || type == 'edit' || type == 'xedit'){
		var event = nlapiGetFieldValue('custentity_hubspot_recent_conversion');
		
		if(isNotEmpty(event) && userId == '54452'){
			if(event.indexOf("unsubscribe") > -1){
				nlapiSetFieldValue("custentity_ta_entity_status", "4");
				nlapiSetFieldValue('entitystatus',6);
				nlapiSetFieldValue("custentity_esc_industry", "40");
			}
			// Contact Us on Taxnotes.com is now using HubSpot form
			// Change the lead source to Web if the lead is created by Contact Us form.
			else if(event.indexOf('TaxNotes.com: Contact Us') > -1){
				nlapiSetFieldValue('leadsource', '-6');
			}
		}

	}
}

function lead_AfterSubmit(type) {
	var old_rec = nlapiGetOldRecord();
	var lead_id = nlapiGetRecordId();
	var context = nlapiGetContext();
	var executionContext = context.getExecutionContext();
	
	if(type == 'edit' || type == 'xedit') {
		var new_rec = nlapiLoadRecord('lead', lead_id);
		var old_conversion_text = old_rec.getFieldValue('custentity_hubspot_recent_conversion');
		var new_conversion_text = new_rec.getFieldValue('custentity_hubspot_recent_conversion');
		var lead_name = new_rec.getFieldValue('email');
		
		// Send email to sales rep if Recent Conversion Event has been changed. 
		
		if(old_conversion_text != new_conversion_text){
			var salesrep = new_rec.getFieldValue('salesrep');
			
			var link = 'https://system.na1.netsuite.com';
			link += nlapiResolveURL('RECORD', 'lead', lead_id);
			var body = 'A lead with email address : ' + lead_name + ' has been involved in different lead conversion event. <br/>';
			body += 'The new conversion event is : ' + new_conversion_text + '<br/>';
			body += 'The old conversion event was : ' +  old_conversion_text + '<br/>';
			body += 'You may access the record by clicking the link below. <br/>';
			body += '<a href="'+ link +'"> Take me there </a>';
			var assoc_rec = new Object();
			assoc_rec['entity'] = lead_id;
			nlapiLogExecution('DEBUG', 'AfterSubmit', 'Sales Rep ' + salesrep);
			// If sales rep is not empty then send email
			(salesrep === '' || salesrep === null) || nlapiSendEmail('141148', salesrep, 'Your lead had new conversion event', body, null, 'karen.megarbane@taxanalysts.org', assoc_rec);
		}
	}
	
	// Create a free trial user if the conversion event was Free Trial
	
	if(type == 'create' || type == 'edit') {
		var event = nlapiGetFieldValue('custentity_hubspot_recent_conversion');
		nlapiLogExecution('DEBUG', 'AFTER Submit', event);
		if(isNotEmpty(event)){
			if(event.indexOf('Free Trial') != -1 && nlapiGetFieldValue('custentity_ta_entity_status') == '1') {
				var email = nlapiGetFieldValue('email');
				var context = nlapiGetContext();
				if(context.getExecutionContext() != 'userinterface' && !hasEmailUsed(email)) {
					var action = event.indexOf('International') > -1 ? 'International' : 'US'; 
					var firstname = nlapiGetFieldValue('firstname');
					var lastname = nlapiGetFieldValue('lastname');
					var today = nlapiDateToString(new Date(), 'date');
					var sched_param = [];
					var freetrial_obj = new Object();
					
					freetrial_obj.action = action;
					freetrial_obj.cust_id = lead_id;
					freetrial_obj.firstname = firstname;
					freetrial_obj.lastname = lastname;
					freetrial_obj.startdate = today;
					freetrial_obj.email = email;
					
					sched_param['custscriptobject'] = JSON.stringify(freetrial_obj);
					
					nlapiLogExecution('DEBUG', 'Free Trial Object', JSON.stringify(freetrial_obj));
					nlapiScheduleScript('customscript_free_trial_automation', 'customdeploy1', sched_param);
				}
			}
		}
		if(type == 'create' && executionContext === 'webstore') {
			nlapiSubmitField('lead', lead_id, 'isinactive', 'F');
			nlapiLogExecution('DEBUG', 'ISINACTIVE', nlapiLookupField('lead', lead_id, 'isinactive'));
		}
	}
	
}



/*
 * Implementing the creation of Free Trial User 
 */

function ta_lead_Freetrial_Sched(type) {
	var context = nlapiGetContext();
	var freetrial_obj = JSON.parse(context.getSetting('SCRIPT', 'custscriptobject'));
	
	var cust_id, firstname, lastname, startdate, email, action;
	
	nlapiLogExecution('DEBUG', 'Free Trial Sched', JSON.stringify(freetrial_obj, false, 2));
	cust_id = freetrial_obj['cust_id'];
	firstname = freetrial_obj['firstname'];
	lastname = freetrial_obj['lastname'];
	startdate = freetrial_obj['startdate'];
	email = freetrial_obj['email'];
	action = freetrial_obj['action'];
	
	try {
		var new_rec = nlapiCreateRecord('customrecord_contractuser');
		new_rec.setFieldValue('custrecord_contractuser_customer', cust_id);
		new_rec.setFieldValue('custrecord_contractuser_email', email);
		new_rec.setFieldValue('custrecord_contractuser_firstname', firstname);
		new_rec.setFieldValue('custrecord_contractuser_lastname', lastname);
		new_rec.setFieldValues('custrecord_contractuser_items', action == 'US' ? [10, 2071] : [1622, 2071]);
		new_rec.setFieldValue('custrecord_contractuser_startdate', startdate);
		new_rec.setFieldValue('custrecord_contractuser_endate', nlapiDateToString(nlapiAddDays(nlapiStringToDate(startdate), 21),'date'));
		new_rec.setFieldValue('custrecord_contractuser_freetrial', 'T');
		var new_id = nlapiSubmitRecord(new_rec, true, false);
		if (new_id) {
				nlapiSubmitField('lead', cust_id, ['custentity_ta_entity_status', 'entitystatus'], ['6', '139']);
		}
	}
	
	catch(e) {
		nlapiLogExecution('ERROR', 'Error in creating Free Trial', e);
	}
}






