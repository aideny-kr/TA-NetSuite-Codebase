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
		else if (taval== 2) {
			nlapiSetFieldValue('entitystatus',124);
		}
		else if (taval== 3) {
			nlapiSetFieldValue('entitystatus',123);//Change to 123 in Production
		}
		else if (taval== 4 || taval == 8 || taval == 7) {
			nlapiSetFieldValue('entitystatus',6);
		}
		else if (taval== 5) {
			nlapiSetFieldValue('entitystatus',138);
		}
		else if (taval== 6){
			nlapiSetFieldValue('entitystatus',139);
		}
		else if (taval == 9) {
			nlapiSetFieldValue('entitystatus', 141);
		}

	}
}

function Lead_BeforeSubmit(type){
	var userId = nlapiGetUser();
	nlapiLogExecution('debug', 'Lead_BeforeSubmit User', userId);
	nlapiLogExecution('debug', 'Lead_BeforeSubmit type', type);
	var leadsource = nlapiGetFieldValue('leadsource');
	var email = nlapiGetFieldValue('email');
	var nsContext = nlapiGetContext();
	var industry = nlapiGetFieldValue('custentity_esc_industry');
	
	var CORP_SALES_REPS_1 = ['17818', '1628167', '19383']; // UPDATE July 29th, 2016 ['Peter', 'Kevin', 'Tony']
	var CORP_SALES_REPS_2 = ['17818', '1628167', '19383', '46408']; //UPDATE July 29th, 2016 ['Peter', 'Kevin', 'Tony', 'Eli']
	
	// FUNCTION 
	function setNextCorpLeadAssignee(curr_index, curr_round) {
	
		if (curr_round == '1'){
			nlapiSubmitField('employee', CORP_SALES_REPS_1[curr_index], 'custentity_ta_next_lead_assignee', 'F');
			// Move to Next Round if last person from CORP_SALES_REPS_1 was assigned
			if(curr_index > -1 && curr_index === CORP_SALES_REPS_1.length - 1) {
				nlapiSubmitField('customrecord_ta_corp_round_robin', '1', 'custrecord_crr_round', '2');
				nlapiSubmitField('employee', CORP_SALES_REPS_2[0], 'custentity_ta_next_lead_assignee', 'T');
			} else if(curr_index > -1 && curr_index !== CORP_SALES_REPS_1.length -1) {
				nlapiSubmitField('employee', CORP_SALES_REPS_1[curr_index + 1], 'custentity_ta_next_lead_assignee', 'T');
			}
		} else if(curr_round == '2'){
			nlapiSubmitField('employee', CORP_SALES_REPS_2[curr_index], 'custentity_ta_next_lead_assignee', 'F');
			if(curr_index > -1 && curr_index === CORP_SALES_REPS_2.length -1) {
				nlapiSubmitField('customrecord_ta_corp_round_robin', '1', 'custrecord_crr_round', '1');
				nlapiSubmitField('employee', CORP_SALES_REPS_1[0], 'custentity_ta_next_lead_assignee', 'T');
			}else if(curr_index > -1 && curr_index !== CORP_SALES_REPS_2.length -1) {
				nlapiSubmitField('employee', CORP_SALES_REPS_2[curr_index + 1], 'custentity_ta_next_lead_assignee', 'T');
			}
		}
	}
	
	
	nlapiLogExecution('DEBUG', 'Leadsource', leadsource);
	if (type == 'create' && nsContext.getExecutionContext() !== "userinterface") {
		
        nlapiSetFieldValue('custentity_uplift_type',6);

        if(leadsource == '-6'){
        	// if leadsource is Web, the lead is from contact us
        	// sets sales rep as blank.
        	nlapiSetFieldValue('salesrep', '');
        }
		
		/**
		/* on creation if email has been used to create lead/prospect mark the record as inactive
		*/
        nlapiLogExecution('DEBUG', 'Before Submit', 'Email = ' + email + ', User = ' + userId + ', executioncontext = ' + nlapiGetContext().executioncontext);
        if(leadAlreadyCreated(email)) { 
        	nlapiSetFieldValue('isinactive', 'T', false, false); 
        	nlapiSetFieldValue('salesrep', '');
        }
        // if email is new, validate domain to see if the domain is used in any customer
        else {
        	var existingCustomerId = taGetCustomerWithSameDomain(email);
        	if(existingCustomerId) {
        		var assignedSalesrep = nlapiLookupField('customer', existingCustomerId, 'salesrep');
        		if(assignedSalesrep) nlapiSetFieldValue('salesrep', assignedSalesrep);
        	} 
        	
        	// At this point, lead is clean. Assign them in normal logic
        	else {
                if(isNotEmpty(userId)){
                	
                	// if userId is 54452, this means the lead is being created by Bedrock Data
                	if(userId == '54452'){
                		
                		// sets leadsource as hubspot 
                		nlapiSetFieldValue('leadsource', '69128');
                		
                		// Industry Corporate Process  
                		if(industry && industry == '39') {
                			var salesrep = '17818'; // default sales rep Peter
                			var filter = [ new nlobjSearchFilter('custentity_ta_next_lead_assignee', '', 'is', 'T') ];
                			var srcResult = nlapiSearchRecord('employee', '', filter);
                			if(srcResult) {
                				salesrep = srcResult[0].getId();
                			} 
                			var round = nlapiLookupField('customrecord_ta_corp_round_robin', '1', 'custrecord_crr_round');
                			nlapiLogExecution('DEBUG', 'BEFORE SUBMIT: Sales Rep for Corporate', salesrep);
                			nlapiSetFieldValue('salesrep', salesrep);

                			if(round === '1') {
                				var curr_index = CORP_SALES_REPS_1.indexOf(salesrep);
                				setNextCorpLeadAssignee(curr_index, round);
                			} else if(round === '2') {
                				var curr_index = CORP_SALES_REPS_2.indexOf(salesrep);
                				setNextCorpLeadAssignee(curr_index, round);
                			}
                		} else {
                			// sets sales rep via default round robin
                			nlapiSetFieldValue("salesrep", "-202");
                		}
                	}
                }
        	}
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
	var nsContext = nlapiGetContext();
	if((type == 'edit' || type == 'xedit') && nsContext.getExecutionContext() !== 'userinterface') {
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
	
	// Create a free trial user if the conversion event has word "Free Trial"
	
	if(type == 'create' || type == 'edit' || type == 'xedit') {
		var event = nlapiGetFieldValue('custentity_hubspot_recent_conversion');
		nlapiLogExecution('DEBUG', 'AFTER Submit', event);
		if(isNotEmpty(event)){
			
			
				// User Event contains word "free trial" AND TA Status is "Untouched"
			if(event.toLowerCase().indexOf('free trial') > -1 && nlapiGetFieldValue('custentity_ta_entity_status') == '1') {
				var email = nlapiGetFieldValue('email');
				var context = nlapiGetContext();
				var freeTrialSelection = nlapiGetFieldValue('custentity_ta_ft_user_selection');
				
				// Prevent UI change or email already used from creating free trial 
				if(context.getExecutionContext() != 'userinterface' && !hasEmailUsed(email)) {
					var action = '';
					
					if (freeTrialSelection) {
						if (freeTrialSelection == '1') {
							action = 'TNT';
						} else if (freeTrialSelection == '2') {
							action = 'STT';
						} else if (freeTrialSelection == '3') {
							action = 'WTD';
						} else if (freeTrialSelection == '4') {
							action = 'US'; // US gives PKDLY
						}
					}
					
					// Run this block when TA FREE TRIAL USER SELECTION field is NOT selected
					else {
					
						/**
						 *  Assigning action variable. 
						 *  Depending on the action variable, The user gets different sets of items. 
						 * */
						if (event.toLowerCase().indexOf('demo federal tax news') > -1) {
							action = 'TNT';
						}
						else if (event.toLowerCase().indexOf('fatca news') > -1) {
							if (event.indexOf('INT') > -1) {
								action =  'WTD'; 
							}
							else if (event.indexOf('USA') > -1) {
								action = 'TNT';
							}
						}
						else if(event.toLowerCase().indexOf('beps news') > -1 || event.toLowerCase().indexOf('demo international tax news') > -1 
								|| event.toLocaleLowerCase().indexOf('ifa attendees') > -1) {
							action = 'WTT and WTD';
						}
						else if(event.toLowerCase().indexOf('worldwide tax treaties') > -1) {
							action = 'WTT';
						}
						else if(event.toLowerCase().indexOf('transfer pricing news') > -1) {
							action = 'WTD';
						}
						else if(event.toLowerCase().indexOf('demo state tax news') > -1 ) {
							action = 'STT';
						}
						else {
							action = event.indexOf('International') > -1 ? 'International' : 'US';
						} 
					}
					
					nlapiLogExecution('DEBUG', 'ACTION', action);
					
					// Call scheduled script to create free trial user
					var firstname = nlapiGetFieldValue('firstname');
					var lastname = nlapiGetFieldValue('lastname');
					var today = nlapiDateToString(new Date(), 'date');
					var sched_param = {};
					var freetrial_obj = {};
					
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
	}
	
}



/*
 * Implement the creation of Free Trial User 
 */

function ta_lead_Freetrial_Sched(type) {
	var context = nlapiGetContext();
	var freetrial_obj = JSON.parse(context.getSetting('SCRIPT', 'custscriptobject'));
	
	var cust_id, firstname, lastname, startdate, email, action, items;
	
	nlapiLogExecution('DEBUG', 'Free Trial Sched', JSON.stringify(freetrial_obj, false, 2));
	cust_id = freetrial_obj['cust_id'];
	firstname = freetrial_obj['firstname'];
	lastname = freetrial_obj['lastname'];
	startdate = freetrial_obj['startdate'];
	email = freetrial_obj['email'];
	action = freetrial_obj['action'];
	
	
	
	// Deciding which sets of item based on the action
	switch(action) {
		case 'US':
			items = [10];
			break;
		
		case 'International':
			items = [1622];
			break;
		
		case 'TNL':
			items = [7];
			break;
		
		case 'TNT':
			items = [7];
			break;
			
		case 'WTD':
			items = [9];
			break;
		
		case 'WTT':
			items = [11];
			break;
			
		case 'WTT and WTD':
			items = [9, 11];
			break;
		
		case 'STT':
			items = [1620];
			break;
		
		default:
			items = [10];
	}
	
	nlapiLogExecution('DEBUG', 'Creating Free Trial', email + ': ' + JSON.stringify(items));
	
	try {
		var new_rec = nlapiCreateRecord('customrecord_contractuser');
		new_rec.setFieldValue('custrecord_contractuser_customer', cust_id);
		new_rec.setFieldValue('custrecord_contractuser_email', email);
		new_rec.setFieldValue('custrecord_contractuser_firstname', firstname);
		new_rec.setFieldValue('custrecord_contractuser_lastname', lastname);
		
		new_rec.setFieldValues('custrecord_contractuser_items', items);
		new_rec.setFieldValue('custrecord_contractuser_startdate', startdate);
		new_rec.setFieldValue('custrecord_contractuser_endate', nlapiDateToString(nlapiAddDays(nlapiStringToDate(startdate), 21),'date'));
		new_rec.setFieldValue('custrecord_contractuser_freetrial', 'T');
		var new_id = nlapiSubmitRecord(new_rec, true, false);
		
		// if New Web User is created then set Lead Status as "Free Trial"
		if(new_id) {
			nlapiSubmitField('lead', cust_id, ['custentity_ta_entity_status', 'entitystatus'], ['6', '139']);
		}
	}
	
	catch(e) {
		nlapiLogExecution('ERROR', 'Error in creating Free Trial', e);
	}
}






