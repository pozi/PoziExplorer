<?php
/**
 * Get live data from a (remote) database
 *
 * @param 		string 		$role	 	role of the logged in user (if not logged in, the role is 'NONE'
 * @param 		string		$id			identifier for the records to be retrieved
 * @param 		string		$infoGroup	information group (Lynx, ...)
 * @param 		string		$config		database to perform the query routing against
 * @return 		string		- resulting json or xml string
 */

# Includes
require_once("../inc/error.inc.php");
require_once("../inc/database.inc.php");
require_once("../inc/security.inc.php");

# Set arguments for error email
$err_user_name = "Herve";
$err_email = "herve.senot@groundtruth.com.au";


# Retrive URL arguments
try {
	$rol = $_REQUEST['role'];
	$idp = $_REQUEST['id'];
	$infogroup = $_REQUEST['infoGroup'];
	$config = $_REQUEST['config'];
	$mode= $_REQUEST['mode'];
	$lga=$_REQUEST['lga'];
	$format = 'json';
}
catch (Exception $e) {
    trigger_error("Caught Exception: " . $e->getMessage(), E_USER_ERROR);
}

# Performs the query and returns XML or JSON
try {

	$sql = sanitizeSQL("select * from gt_service_routing where (role='".$rol."' or role='*') and info_group='".$infogroup."'");

	if ($mode == 'pgsql')
	{
		$pgconn = pgConnection();
		$conn = $pgconn;
	}
	elseif ($mode == 'sqlite')
	{
		// SQLite connection (using PDO) - relies on the SQLite file to be in the same directory as this script
		if (file_exists($config.".sqlite"))
		{
			$sqliteConn = new PDO("sqlite:".$config.".sqlite", null, null, array(PDO::ATTR_PERSISTENT => true));
			$conn = $sqliteConn;
		}
		else
		{
			trigger_error("The SQLite configuration file for '".$config."' can not be found.", E_USER_ERROR);
		}
	}
	else
	{
		// Trigger error, this should not happen
	}

    /*** fetch into an PDOStatement object ***/
    $recordSet = $conn->prepare($sql);
    $recordSet->execute();

	$query_to_exec='';
	$connection_str ='';
	$username_conn ='';
	$password_conn ='';

	$filter_query_to_exec='';
	$filter_connection_str ='';
	$filter_username_conn ='';
	$filter_password_conn ='';

    // Using the query returned to build an ODBC request
	while ($row  = $recordSet->fetch(PDO::FETCH_ASSOC))
	{
		foreach ($row as $key => $val)
		{
			if ($key == "query")
			{
				$query_to_exec = $val;
			}
			if ($key == "odbc_conn_str")
			{
				$connection_str = $val;
			}
			if ($key == "username_conn")
			{
				$username_conn = $val;
			}
			if ($key == "password_conn")
			{
				$password_conn = $val;
			}
			if ($key == "filter_query")
			{
				$filter_query_to_exec = $val;
			}
			if ($key == "filter_odbc_conn_str")
			{
				$filter_connection_str = $val;
			}
			if ($key == "filter_username_conn")
			{
				$filter_username_conn = $val;
			}
			if ($key == "filter_password_conn")
			{
				$filter_password_conn = $val;
			}
		}
	}

	// Adding a filtering step to source the IDs/attributes/geometries possibly from another database
	// This filtering step is optional but helps when the required spatial/attribute data are silo'd in different databases/servers
	if ($idp && $filter_connection_str)
	{
		// Establishing the connection based on the configuration in gt_service_routing
	    $conn3 = new PDO($filter_connection_str, $filter_username_conn, $filter_password_conn, array(PDO::ATTR_PERSISTENT => true));

		// Replacing all instances of %1% in the query with a specific ID
		$sql3 = str_replace("%1%",$idp,$filter_query_to_exec);

		if (isset($_REQUEST['debug']))
		{
			echo $filter_connection_str."\n";
			//echo $filter_username_conn."\n";
			//echo $filter_password_conn."\n";
			echo $sql3."\n";
		}
		$recordSet3 = $conn3->prepare($sql3);
		$recordSet3->execute();	

		while ($row3  = $recordSet3->fetch(PDO::FETCH_ASSOC))
		{
			foreach ($row3 as $key => $val)
			{
				if ($key == "id")
				{
					$idp = $val;
				}
			}
		}
	
	}	

	if ($idp && $connection_str)
	{
		// Establishing the connection based on the configuration in gt_service_routing
	    $conn2 = new PDO($connection_str, $username_conn, $password_conn, array(PDO::ATTR_PERSISTENT => true));

		// Replacing all instances of %1% in the query with a specific ID
		$sql = str_replace("%1%",$idp,$query_to_exec);
		$sql = str_replace("%2%",$lga,$sql);

		if (isset($_REQUEST['debug']))
		{
			echo $connection_str."\n";
			//echo $username_conn."\n";
			//echo $password_conn."\n";
			echo $sql."\n";
		}
		$recordSet2 = $conn2->prepare($sql);
		$recordSet2->execute();

		require_once("../inc/json.pdo.inc.php");
		if (isset($_REQUEST['callback']))
		{
			header("Content-Type: text/javascript");
		}
		else
		{
			header("Content-Type: application/json");
		}
		echo rs2json($recordSet2);
	}
	else
	{
		if (isset($_REQUEST['callback']))
		{
			header("Content-Type: text/javascript");
			echo $_REQUEST['callback']."({\"total_rows\":\"0\",\"rows\":[]})";
		}
		else
		{
			header("Content-Type: application/json");
			echo "{\"total_rows\":\"0\",\"rows\":[]}";
		}
	}

}
catch (Exception $e) {
	trigger_error("Caught Exception: " . $e->getMessage(), E_USER_ERROR);
}

?>