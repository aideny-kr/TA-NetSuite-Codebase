/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 May 2016     Chan
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function resetValuesScheduled(type) {
	var FLDS_TO_UPDATE = ['custentity_activecontractvalue', 'custentity_activecontracts']; 
	var filters = [];
	filters.push(new nlobjSearchFilter('custentity_ta_retained_until', null, 'before', 'today'));
	filters.push(new nlobjSearchFilter('custentity_activecontractvalue', null, 'greaterthan', 0));
	var records = nlapiSearchRecord('customer', null, filters);

	if(records){
		nlapiLogExecution('DEBUG', 'Number of Customers to Update', records.length);
		for( var i = 0; i < records.length; i++ ) {
			
			nlapiSubmitField('customer', records[i].getId(), FLDS_TO_UPDATE, [0, 0]);
		    if( (i % 2) == 0 ) taSetRecoveryPoint(); //every 2 customers, we want to set a recovery point so that, in case of an unexpected server failure, we resume from the current "i" index instead of 0
		    taCheckGovernance();
		    nlapiLogExecution('DEBUG', 'Updated Customer ID', records[i].getId());
		 }
		nlapiLogExecution('AUDIT', 'SCRIPT ENDED', nlapiDateToString(new Date()));
	}
}
	
	

