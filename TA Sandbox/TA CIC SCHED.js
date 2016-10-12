/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 May 2016     Chan
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function taPostWebUserSched(type) {
	var datain = nlapiGetContext().getSetting('SCRIPT', 'custscript_user_obj');
	datain = JSON.parse(datain);
	nlapiLogExecution('DEBUG', 'After Parse', JSON.stringify(datain));
	var err = new Object();
	
	for( var i = 0; i < datain.length; i += 1 ) {
		var JSON_TO_DRUPAL = {};
		var cic_items = datain[i].cic_items;
		var submitted_cic_id;
		JSON_TO_DRUPAL['action'] = datain[i].action;
		JSON_TO_DRUPAL['id_contact'] = datain[i].id_contact;
		JSON_TO_DRUPAL['usertype'] = datain[i].usertype;
		JSON_TO_DRUPAL['email'] = datain[i].email;
		JSON_TO_DRUPAL['id_customer'] = datain[i].id_customer;
		JSON_TO_DRUPAL['emailOption'] = datain[i].email_option == 'T' ? 'suppress' : '';
		JSON_TO_DRUPAL['items'] = [];
		
		if (typeof datain[i].password !== 'undefined') JSON_TO_DRUPAL['password'] = datain[i].password; 
		
		for (var x = 0; x < cic_items.length; x += 1) {
			try {
				if(!taCheckDuplicateCic(datain[i].id_contact, cic_items[x].item_id)) {
					var cic_rec = nlapiCreateRecord('customrecord_cic');
					var item_id = cic_items[x].item_id;
					cic_rec.setFieldValue('custrecord_cic_company', datain[i].id_customer);
					cic_rec.setFieldValue('custrecord_cic_contact', datain[i].id_contact);
					cic_rec.setFieldValue('custrecord_cic_contract', cic_items[x].contract_id);
					cic_rec.setFieldValue('custrecord_cic_contract_item', cic_items[x].contract_item_id);
					cic_rec.setFieldValue('custrecord_cic_end_date', cic_items[x].end_date);
					cic_rec.setFieldValue('custrecord_cic_item', cic_items[x].item_id);
					submitted_cic_id = nlapiSubmitRecord(cic_rec, true, true);
					
					// after CIC record is created, push the item to JSON_TO_DRUPAL
					if (typeof submitted_cic_id !== 'undefined') {
						var item_info = {
							// !LIBRARY function taGetKitMember
							item_id: submitted_cic_id,	
							role_id: nlapiLookupField('item', item_id, 'type') === 'Kit' ? taGetKitMember(item_id) : item_id,
							id_contract: cic_items[x].contract_id,
							enddate: cic_items[x].end_date,
							freetrial: 'F'
						}; 
						JSON_TO_DRUPAL['items'].push(item_info);
					}
				}
			}
			catch(e) {
				err.code = e;
				err.status = 'failed on creating CIC';
				nlapiLogExecution('ERROR', 'Error in creating New User', e);
				throw e;
			}

		}

		
		// Sending JSON_TO_DRUPAL to Drupal if JSON_TO_DRUPAL.item array isn't empty
		if(JSON_TO_DRUPAL.items.length || JSON_TO_DRUPAL.action == 'ecommerse'){
			nlapiLogExecution('DEBUG', 'JSON_TO_DRUPAL', JSON.stringify(JSON_TO_DRUPAL));
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
		
		//in every loop, we want to set a recovery point. 
		//in case of an unexpected server failure, we resume from the current "i" index instead of 0
		
	    taSetRecoveryPoint();
	    taCheckGovernance();
	}
	
}
