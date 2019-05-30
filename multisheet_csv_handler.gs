function main() {
  onOpen();
}

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var csvMenuEntries = [{name: "export as csv files", functionName: "saveAsCSV"}, {name: "import csv files", functionName: "readCSVFiles"}];
  ss.addMenu("csv", csvMenuEntries);
};

// Import Functions:

function readCSVFiles() {
  Logger.log("reading files from source_folder");
  var folders = DriveApp.getFoldersByName('source_folder');
  var newSpreadSheet = SpreadsheetApp.create("Merged Sheets");
  while (folders.hasNext()) {
    var folder = folders.next();
    var files = folder.getFiles();
    Logger.log("folder: "+ folder);
    while (files.hasNext()) {
      var file = files.next();
      Logger.log("converting files");
      var csvSpreadSheetTmp = Drive.Files.copy({}, file.getId(), {convert: true});
      var csvSpreadSheet = SpreadsheetApp.openById(csvSpreadSheetTmp.id);
      csvSpreadSheet.getSheets()[0].copyTo(newSpreadSheet);
      Drive.Files.emptyTrash();
      Drive.Files.remove(csvSpreadSheetTmp.id);
    }
  }
  Logger.getLog()
}

function renameSheets() {
  var files = DriveApp.getFilesByName("Merged Sheets");
  while (files.hasNext()) {
    var file = files.next();
    var myspreadsheet = SpreadsheetApp.openById(file.getId());
    var allsheets = myspreadsheet.getSheets()
    Logger.log("allsheets:"+allsheets);
    for (var i in allsheets) {
      var sheetName = allsheets[i].getName();
      newSheetName = sheetName.replace('Copy of ', '');
      allsheets[i].setName(newSheetName);
      Logger.log(newSheetName);
    }
  }
}

// Export Functions:

function saveAsCSV() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  // create a folder from the name of the spreadsheet
  var folder = DriveApp.createFolder(ss.getName().toLowerCase().replace(/ /g,'_') + '_csv_' + new Date().getTime());
  for (var i = 0 ; i < sheets.length ; i++) {
    var sheet = sheets[i];
    // append ".csv" extension to the sheet name
    fileName = sheet.getName() + ".csv";
    // convert all available sheet data to csv format
    var csvFile = convertRangeToCsvFile_(fileName, sheet);
    // create a file in the Docs List with the given name and the csv data
    folder.createFile(fileName, csvFile);
  }
  Browser.msgBox('Files are waiting in a folder named ' + folder.getName());
}

function convertRangeToCsvFile_(csvFileName, sheet) {
  // get available data range in the spreadsheet
  var activeRange = sheet.getDataRange();
  try {
    var data = activeRange.getValues();
    var csvFile = undefined;

    // loop through the data in the range and build a string with the csv data
    if (data.length > 1) {
      var csv = "";
      for (var row = 0; row < data.length; row++) {
        for (var col = 0; col < data[row].length; col++) {
          if (data[row][col].toString().indexOf(",") != -1) {
            data[row][col] = "\"" + data[row][col] + "\"";
          }
        }

        // join each row's columns
        // add a carriage return to end of each row, except for the last one
        if (row < data.length-1) {
          csv += data[row].join(",") + "\r\n";
        }
        else {
          csv += data[row];
        }
      }
      csvFile = csv;
    }
    return csvFile;
  }
  catch(err) {
    Logger.log(err);
    Browser.msgBox(err);
  }
}
