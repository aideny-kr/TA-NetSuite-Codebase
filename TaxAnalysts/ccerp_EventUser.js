/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Feb 2015     Dana
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */

function ccerp_EventBeforeSubmit(type){
	nlapiLogExecution('debug','ccerp_EventBeforeSubmit '+type);
	if(type == 'create' || type == 'edit'){
		var cpeevent = nlapiGetFieldValue('custevent_on24_event');
		var user = nlapiGetUser();
		var context = nlapiGetContext();
		var executioncontext = context.getExecutionContext();
		nlapiLogExecution('debug','executioncontext '+executioncontext);
		if (executioncontext == 'webservices' || user == '8201'){
			var eventJSON = nlapiGetFieldValue('message');
			var eventval = JSON.parse(eventJSON);
			var name = eventval.custrecord_taevent_eventid;
			//Create/Update TA Event Record
			var taeventrec = '';
			if (isEmpty(cpeevent))
				taeventrec = nlapiCreateRecord('customrecord_taevent');
			else
				taeventrec = nlapiLoadRecord('customrecord_taevent',cpeevent);
			
			for (var fld in eventval){

		    	var value = eventval[fld];
		    	
		    	// Adjusting time 
		    	if(fld == 'custrecord_taevent_archiveend' || 
		    		fld == 'custrecord_taevent_archivestart' || 
		    		fld == 'custrecord_taevent_eventtime' || 
		    		fld == 'custrecord_taevent_liveend' ||
		    		fld == 'custrecord_taevent_livestart') {
		    		
		    		var timeBefore = new Date(value);
		    		
		    		//DST adjustment
		    		var timeAdjusted = moment(timeBefore).isDST() ? moment(timeBefore).subtract(4, 'hours'):
		    													moment(timeBefore).subtract(5, 'hours');
		    		//var timeAdjust = Date.parse(timeBefore)-(5*60*60*1000);
		    		value = nlapiDateToString(new Date(timeAdjusted._d),'datetimetz');
		    	}
		    	if (isEmpty (value))
		    		continue;
		    	else
		    		taeventrec.setFieldValue(fld,value);
		    }
			taeventrec.setFieldValue('name',name);
			var taeventid = nlapiSubmitRecord(taeventrec);
			if (isEmpty(cpeevent))
				nlapiSetFieldValue('custevent_on24_event',taeventid);
		}	
		//nlapiLogExecution('debug','custrecord_taevent_eventid '+custrecord_taevent_eventid);
	}
 
}
