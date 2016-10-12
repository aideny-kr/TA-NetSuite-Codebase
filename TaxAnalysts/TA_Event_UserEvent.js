/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Mar 2015     huichanyi
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
function beforeSubmitUpdateTz(type){
	nlapiLogExecution('debug','beforeSubmitUpdateTz'+type)
	if(type == 'edit'){
		var archiveEnd = nlapiGetFieldValue('custrecord_taevent_archiveend');
		nlapiSetDateTimeValue('custrecord_taevent_archiveend', archiveEnd, 'America/New_​York');
	}
}