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
	function runScheduledScript(status, queueid)
	{
	 var records = nlapiSearchRecord('customer', 15);
	 
	 for( var i = 0; i < records.length; i++ )
	 {
	       handleCustomer(records[i].getRecordType(), records[i].getId());
	   
	    if( (i % 5) == 0 ) setRecoveryPoint(); //every 5 customers, we want to set a recovery point so that, in case of an unexpected server failure, we resume from the current "i" index instead of 0
	   
	    checkGovernance();
	 }
	}
	 
	function setRecoveryPoint()
	{
	 var state = nlapiSetRecoveryPoint(); //100 point governance
	 if( state.status == 'SUCCESS' ) return;  //we successfully create a new recovery point
	 if( state.status == 'RESUME' ) //a recovery point was previously set, we are resuming due to some unforeseen error
	 {
	  nlapiLogExecution("ERROR", "Resuming script because of " + state.reason+".  Size = "+ state.size);
	  handleScriptRecovery();
	 }
	 else if ( state.status == 'FAILURE' )  //we failed to create a new recovery point
	 {
	     nlapiLogExecution("ERROR","Failed to create recovery point. Reason = "+state.reason + " / Size = "+ state.size);
	  handleRecoveryFailure(state);
	 }
	}
	 
	function checkGovernance()
	{
	 var context = nlapiGetContext();
	 if( context.getRemainingUsage() < myGovernanceThreshold )
	 {
	  var state = nlapiYieldScript();
	  if( state.status == 'FAILURE'
	     {
	      nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
	   throw "Failed to yield script";
	  } 
	  else if ( state.status == 'RESUME' )
	  {
	   nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
	  }
	  // state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
	 }
	}
	 
	function handleRecoverFailure(failure)
	{
	 if( failure.reason == 'SS_MAJOR_RELEASE" ) throw "Major Update of NetSuite in progress, shutting down all processes";
	 if( failure.reason == 'SS_CANCELLED' ) throw "Script Cancelled due to UI interaction";
	 if( failure.reason == 'SS_EXCESSIVE_MEMORY_FOOTPRINT ) { cleanUpMemory(); setRecoveryPoint(); }//avoid infinite loop
	 if( failure.reason == 'SS_DISALLOWED_OBJECT_REFERENCE' ) throw "Could not set recovery point because of a reference to a non-recoverable object: "+ failure.information; 
	}
	 
}
