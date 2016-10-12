/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Feb 2015     huichanyi
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */

function cpeEvent_RESTlet(datain) {
	// receive datain JSON object and parse it
	// compare datain.contractId value with search 'customsearch_chan_on24_integration'
		//if contractId matches search 
			// push to registered events {}
		//else 
			// push to upcoming events {}
	

	// Creating err object
	var err = new Object();
	// Enable debugging Log Execution
	nlapiLogExecution('debug', 'cpeEvent_RESTlet', 'BEGIN');
	
	try {
		var getdata = datain;
		var contactId = getdata.contactId;
		var allEvents = new Array(); 
		var matchingEvents = new Array(); 
		var groupedArray = new Array();
		var itemFil = new Array();
		var itemCol = new Array();
		itemFil.push(new nlobjSearchFilter('custrecord_regatt_contact', 'CUSTRECORD_EVENTREG_EVENTID', 'is', contactId));
		itemCol.push(new nlobjSearchColumn('custrecord_taevent_key'));
		// search for all events
		var itemResults = nlapiSearchRecord(null, 'customsearch_chan_on24_integration', null, itemCol);
		// search for events matches contactId
		var itemResults2 = nlapiSearchRecord(null, 'customsearch_chan_on24_integration', itemFil, itemCol);
		// itemResults loop
		if(itemResults) {
			for(var i = 0; i < itemResults.length; i++){
				
				// pushes to allEvents array for all upcoming events within 8 weeks
				allEvents.push({
					'netsuiteId': itemResults[i].getId(),
					'eventId': itemResults[i].getValue('custrecord_taevent_eventid'),
					'eventTime': itemResults[i].getValue('custrecord_taevent_eventtime'),
					'eventTitle': itemResults[i].getValue('custrecord_taevent_eventtitle'),
					'eventKey': itemResults[i].getValue('custrecord_taevent_key')	
					// linking item results : itemResults[0].getValue("custrecord_regatt_contact","CUSTRECORD_EVENTREG_EVENTID");
				});
				
				}
		}

		//if there is contactID in datain push the events object to matchingEvents array
		if(isNotEmpty(itemResults2) && isNotEmpty(contactId)) {
			for(var y = 0; y < itemResults2.length; y++){
					matchingEvents.push({
						'netsuiteId': itemResults2[y].getId(),
						'eventId': itemResults2[y].getValue('custrecord_taevent_eventid'),
						'eventTime': itemResults2[y].getValue('custrecord_taevent_eventtime'),
						'eventTitle': itemResults2[y].getValue('custrecord_taevent_eventtitle'),
						'eventKey': itemResults2[y].getValue('custrecord_taevent_key')
					});	
			}
		
		}
		
		// Grouping them for multi-dimentional array
		groupedArray.push(matchingEvents, allEvents);
		
		return JSON.stringify(groupedArray);

		
	} catch(e) {
		nlapiLogExecution('error', 'Exception', e);
		err.status = 'Fail';
		err.code = e.code;
		err.details = e.details;
		return err;
	}
}



