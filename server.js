const path = require('path')
const http = require('http')
const https = require('https');
const find = require('find')
const fs = require('fs');
const Queue = require('./dungqueue.js');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};


const myday = require('./mydaymodule');
const crypto = require('./encryptionmodule');

let validtime = new Date().getTime() - 50000;
let logouttime = new Date().getTime();

//let stilldownload = false;
//let stilldel = false;
//console.log(stilldownload);

let currentcommand = 0;

//for upload
let numberupload = 0;
let numbercheckupload = 0;
let filesupload = new Array(31);
let exec_find = new Array(31);
let existedfile = new Array(31);
let currentpathupload = '';
let currentuploadfile = '';

const rootDir = __dirname;

const resDir = '/var/res';
// import express (after npm install express)
const express = require('express');

// create new express app and save it as "app"
const app = express();

// server configuration
const PORT = 1999; 

//parser
const bodyParser = require('body-parser');

const querystring = require('querystring');

const multer = require('multer');

//exec command
const sys = require('util')

const exec = require('child_process').exec;


//set express configuration
app.use(bodyParser.urlencoded({ extended: true}));

app.use(bodyParser.json());

// make the server listen to requests
/*
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}/`);
});
*/

const httpsServer = https.createServer(options, app);

httpsServer.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}/`);
});


 

/********
 * GET IMAGE FILE *
 * **********/
 
app.get('/images/:fileName', function(req ,res) {
    var path = require('path');
    var file = path.join(rootDir + "/images/", req.params.fileName);
    res.sendFile(file);
});

/********
 * VIEW FILE  *
 * **********/

app.get('/viewfile', function(req ,res) {
    console.log('View File:' + req.url);
	let token = req.query.token;
	let currentdir = req.query.currentdir;
	let fname = req.query.fname;
	fname = fname.trim().hexDecode();
	currentdir = currentdir.trim().hexDecode();
	console.log("token:" + token);
	console.log("currentdir:" + currentdir);
	console.log("fname:" + fname);
	
	//if(currentdir=='')
	console.log('file need to view:' + (resDir + currentdir + '/' + fname));
	
	if(fname==''){
		res.send("Filename is empty!");
		return;
	}
	
	//currentcommand;//test
	
	if(currentcommand != 0){
	  res.send("Server is busy! line 145");
	  return;
	}
	
	currentcommand = 5;
	let str_fileext = '';
	if(fname.lastIndexOf('.')!=-1)
		str_fileext = fname.substring(fname.lastIndexOf('.')+1,fname.length);
		
	console.log("file ext:"+str_fileext);
	
	fs.readFile(resDir + currentdir + '/' + fname, function (err,data) {
		 if (err) {
			//throw err; 
			res.send('Error! File not found or Error while reading!');
			currentcommand = 0;
			return;
		 }  

		 res.setHeader('content-type', 'text/html;charset=utf-8');
		 res.write('<html>');
		 res.write('<head>');
		 res.write('<style>');
		 res.write('html { height:100%; }');
		 res.write('body { position:absolute; top:0; bottom:0; right:0; left:0; }');
		 res.write('textarea { position:absolute; width: 100%;height: 90%; }');
		 res.write('</style>');
		 res.write('<script>');
		 res.write('function logout(){');
         res.write('window.location.href=\'./logout?p=\'+ document.getElementById("token").value + \':\';}');
		 res.write('function back(){');
         res.write('window.location.href=\'./path?p=\'+ document.getElementById("token").value + \':\' + document.getElementById("path").value;}');
		 res.write('</script>');
		 res.write('</head>');
		 res.write('<body>');
		 res.write('<div><input type=button id="logout"  value="Logout" onclick = "logout()">');
		 res.write('<input type=button id="back"  value="Back" onclick = "back()"></div>');
		 
		 if(str_fileext=='htm'||str_fileext=='html'||str_fileext==''||str_fileext=='txt'||str_fileext=='cc'||str_fileext=='c'||str_fileext=='cpp'){
			res.write('<textarea readonly>');
			res.write(data); 
			res.write('</textarea>');
		 }
		 else if (str_fileext=='png'||str_fileext=='jpg'||str_fileext=='jpeg'||str_fileext=='gif'){
			let s_img = new Buffer(data).toString('base64');
			//console.log(s_img);
			res.write('<img id="ImgPreview"src="data:image/*;base64,' + s_img + '"></img>'); 
		 }
		 else 
		    res.write('File format is not text file, hence it is not supported!');
		  
		 res.write('<input type="hidden" id="token" name="token" value="'+token+'">');
		 res.write('<input type="hidden" id="path" name="path" value="'+currentdir.hexEncode()+'">');	 
		 res.write('</body>');
		 res.write('</html>');
		 res.end();
		 
		 currentcommand = 0;
	 });
});

/********
 * LOG IN *
 * **********/
 
// create a route for the app
app.get('/', (req, res) => {
  //res.send('Hello World');
  
  fs.readFile(__dirname + '/index.html', function (err,html) {
    if (err) {
        throw err; 
    }  
    res.writeHeader(200, {"Content-Type": "text/html"});  
    res.write(html);  
    res.end();  
  });
});


    
async function checkUploadingFileAsync() {
	
	let str_out1 = await execShellCommand("wc -c /home/dungnt/StoreProj/www_trash/" + currentuploadfile + " | awk '{print $1}'");
	let x = Number(str_out1);
	await PromiseTimeout(3000);
	let str_out2 = await execShellCommand("wc -c /home/dungnt/StoreProj/www_trash/" + currentuploadfile + " | awk '{print $1}'");
	let y = Number(str_out2);
	console.log(str_out1 + "----" + str_out2);
	if(x==0) return 0;
	else if(y==0) return 0;
	else if(x==y) return 0;
	else return 1;
}

async function finishUploadingFileAsync(req, res) {
	
	let kq = await checkUploadingFileAsync();
	console.log("kq="+kq);
	if(kq==0){
		currentcommand = 0;
		reponseToLogIn(req,res);
	}
	else{
		res.send("Server is busy!line221");
	}
}

function reponseToLogIn(req, res){
	//write log time to file for bash copy process
	updatelogtime(true);
	//always kill zip process
	exec("kill $(pidof zip)", function(err, stdout, stderr) {
		if (err) {
		}
	});

	//always remove trash
	//if(currentcommand == 4){
	let action = exec("rm ./www_trash/*.*", function(err, stdout, stderr) {
		if (err) {
			//console.log('err:'+err);
			//res.send("Error occurred in server!");
			//return;
		}
	
		currentcommand = 0;
	
		fs.readFile(__dirname + '/content.html', function (err,html) {
			 if (err) {
				throw err; 
			 }  
			 validtime = new Date().getTime();
			
			 res.setHeader('content-type', 'text/html');
			 res.write(html);  
			 var output = myday.generatetoken();
			 writefirst(res,resDir,output.encryptedData,true,'','');
		});//end readfile
	});//end action
}

app.post('/',function(req,res){
    var username = req.body.username;
    var password = req.body.password;
    res.setHeader('content-type', 'text/html');
    if(username!=='hello'||password!=='1234'){//password!=='123456abc_luutruonline'){
   	  res.send("Login invalid!");
    }
    else{
		
		if((currentcommand != 0)&&(currentcommand != 4)){
		  res.send("Server is busy!line267");
		  return;
		}
		
		if(currentcommand == 4){
			console.log("command=4");
			//check upload process
			finishUploadingFileAsync(req,res).then(function() {});
		}
		else
			reponseToLogIn(req,res);
		
	}
});

/********
 * LOG OUT *
 * **********/
 
app.get('/logout', (req, res) => {
  let p = querystring.parse(req.url)['/logout?p'];
  let token = p.substring(0,p.indexOf(":"));
  //console.log("logout token:" + token);
  let cleartoken = crypto.decryptfromtext(token);
  let s1 = cleartoken.substring(cleartoken.indexOf(":")+1,cleartoken.length);
  logouttime = s1;

  
  let action1 = exec("kill $(pidof zip)", function(err, stdout, stderr) {
			if (err) {
			}
  });
  
  /*
  let action2 = exec("kill $(pidof rm)", function(err, stdout, stderr) {
			if (err) {
			}
  });
  */
  
  //currentcommand = 0;
  
  fs.readFile(__dirname + '/index.html', function (err,html) {
    if (err) {
        throw err; 
    }  
    res.writeHeader(200, {"Content-Type": "text/html"});  
    res.write(html);  
    res.end();  
  });
});


/********
 * Upload Single File *
 * **********/

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
	currentpathupload = req.body.uploadpath;
	currentpathupload = currentpathupload.trim().hexDecode();
	cb(null, 'www_trash');
  },
  filename: function (req, file, cb) {
	console.log('start upload:' + file.originalname);
	currentuploadfile = file.originalname;
	currentcommand = 4;
	filesupload[numberupload] = file.originalname;
	existedfile[numberupload] = 0;
	exec_find[numberupload] = 'find "'+resDir + req.body.uploadpath.trim().hexDecode().replace(/`/g, "\\`") + '/" -maxdepth 1 -name "'+ file.originalname.replace(/`/g, "\\`") + '"';
	numberupload++;
	cb(null, file.originalname);
  }
})

/*
 * onError was removed 
 * 
let upload = multer({ storage: storage, onError : function(err, next) {
	  currentcommand = 0;
	  if(err)
			console.log('error upload');
      next(err);
    }
})
*/

let upload = multer({ storage: storage }).single('singleFile');

app.get('/upload',(req,res,next)=>{
	console.log("Req to Upload File" + req.url);
	let token = req.query.token;
	let currentdir = req.query.currentdir;
	//console.log("token: " + token);
	currentdir = currentdir.trim().hexDecode();
	console.log("currenrdir: " + currentdir);
	
	//check valid token
	if(checkvalidtoken(token,res)===false)
		return;
	
	//check valid time
	if(checkvalidtime(res)===false)
		return;
	
	if (currentdir.trim().localeCompare("")==0){
		res.send("Can not upload in root folder!");
		return;
	}
	
	if(currentdir.trim().indexOf("/backup") != -1){
		res.send('Can not upload in backup folder!');
		return;
	}
	
    if(currentcommand!=0){
		res.send('Server is busy!line370');
		return;
	}

	let execpath = 'cd "' + rootDir + '";rm -r ./www_trash;';
	
	console.log(execpath);
	
	exec(execpath, function(err, stdout, stderr) {
		if (err) {
			res.send('Server is busy!line 381');
			return;
		}
		console.log('remove trash ok');
		
		execpath = 'cd "' + rootDir + '";mkdir ./www_trash;';
	
		exec(execpath, function(err, stdout, stderr) {
			if (err) {
				res.send('Server is busy!line 390');
				return;
			}
			
			upload(req, res, function (err) {
				if (err instanceof multer.MulterError) {
				  // A Multer error occurred when uploading.
				  console.log("Upload Error");
					
				} else if (err) {
				  // An unknown error occurred when uploading.
				  console.log("Upload Error");
				}
				
				// Everything went fine 
				console.log('make null trash ok');
				currentpathupload = '';
				numberupload = 0;
				numbercheckupload = 0;
				fs.readFile(__dirname + '/uploadfile.html', function (err,html) {
					 if (err) {
						throw err; 
					 }  
					 res.setHeader('content-type', 'text/html');
					 res.write(html);  
					 if(currentdir=='')
						res.write('<h2>/</h2>'); 
					 else 
						res.write('<h2>' + currentdir + '</h2>');
					 res.write('<h3><p id="mes"></p></h3>');
					 res.write('<h2><form id="file-catcher" action="/uploadmultiple"  enctype="multipart/form-data" method="POST">');
					 res.write('<input id="submitbutton" type="submit" value="Upload"/>');
					 res.write('<input id="uploadpath" type="hidden" name="uploadpath" value="'+currentdir.hexEncode()+'" />');
					 res.write('<input id="uploadtoken" type="hidden" name="uploadtoken" value="'+token+'" />');
					 res.write('<input id="file-input" type="file" name="myFiles" multiple></form></h2>');
					 res.write('<table id="myTable"><thead><tr><th><p>Upload List</p></th><th></th><th><a>&nbsp;&nbsp;&nbsp;&nbsp;</a></th>');
					 res.write('</tr></thead><tbody></tbody></table>');
					 res.write('<input type="hidden" id="token" name="token" value="'+token+'">');
					 res.write('<input type="hidden" id="path" name="path" value="'+currentdir.hexEncode()+'">');
					 res.write('</div></body></html>');
					 res.end();

				});//end readfile
					
			});//end upload
			
		});//end exec
	}); //end exec
	
	
  
});

/*
app.post('/uploadsingle', upload.single('myFile'), (req, res, next) => {
  const file = req.file;
  //console.log(req.body.uploadpath);
  //console.log(req.url);
  if (!file) {
    const error = new Error('Please upload a file');
    error.httpStatusCode = 400;
    return next(error);

  }
    res.sendFile(__dirname + '/test_uploadfile2.html');
})
*/

/********
 * Upload Multi File *
 * **********/
 
let uploadmulti = multer({ storage: storage });

async function checkExistFileAsync() {
	for(let i=0;i<numberupload;i++){
		let str_out = await execShellCommand(exec_find[i]);
		numbercheckupload ++;
		console.log("find file:" + str_out);
		if(str_out=='err'){
			existedfile[numbercheckupload-1] = 100;
		}
		else if(str_out==''){
			existedfile[numbercheckupload-1] = 1;
			console.log('numbercheckupload = ' + (numbercheckupload-1) + ' file chua ton tai');
		}
		else{
			existedfile[numbercheckupload-1] = 2;
			console.log('numbercheckupload = ' + (numbercheckupload-1) + ' file da ton tai');
		}
	}
}

 
app.post('/uploadmultiple', uploadmulti.array('myFiles', 31), (req, res, next) => {
  const files = req.files;
  
  if (!files) {
    const error = new Error('Please choose files');
    error.httpStatusCode = 400;
    currentcommand = 0;
    currentpathupload = '';
    numberupload = 0;
    numbercheckupload = 0;
    return next(error);
  }
  
  /******************
   * move from www_trash to www
   * ****************/
   checkExistFileAsync().then(function() {
	   //setTimeout(() => {
		   console.log('-----after async checkexistfile------');
		   
		   let execpath = '';
		   let str_filename = '';
		   let str_fileext = '';
		   let oldname = [];
		   let newname = [];
		   
		   for (let i = 0; i < files.length; i++) {
			   for (let j = i; j < numberupload; j++) {
				   if(files[i].originalname==filesupload[j]){
					    if(existedfile[j]==100){
							res.send('Error! path is wrong!');
							currentcommand = 0;
							currentpathupload = '';
							numberupload = 0;
							numbercheckupload = 0;
							return;
						}
						
					    if(files[i].originalname.lastIndexOf('.')!=-1){
							str_filename = files[i].originalname.substring(0,files[i].originalname.lastIndexOf('.'));
							str_fileext = files[i].originalname.substring(files[i].originalname.lastIndexOf('.')+1,files[i].originalname.length);
							//console.log(str_filename);
							//console.log(str_fileext);
							if(existedfile[j]==2){
								oldname.push(files[i].originalname);newname.push(str_filename + '-' + Date.now() + '.' + str_fileext);
							} else{
								oldname.push(files[i].originalname);newname.push(files[i].originalname);
							}
						}
						else{
							if(existedfile[j]==2){
								oldname.push(files[i].originalname);newname.push(files[i].originalname + '-' + Date.now());
							} else{
								oldname.push(files[i].originalname);newname.push(files[i].originalname);
							}
						}
						
						//console.log("j= " + j + " existedfile " + existedfile[j]);
				   }
			   }
			}
			
			
			console.log(oldname);
			console.log(newname);
			let s = 'mv "/home/dungnt/StoreProj/www_trash/';
			for (let i = 0; i < files.length; i++) {
				execpath=execpath+s+oldname[i].replace(/`/g, "\\`")+'" "' + resDir+currentpathupload.replace(/`/g, "\\`")+'/'+newname[i].replace(/`/g, "\\`")+'";';
			}
			console.log('execpath:'+execpath);
	
			exec(execpath, function(err, stdout, stderr) {
				  if (err) {
					console.log(stdout);
					res.send('Server is busy!line558');
					currentcommand = 0;
					currentpathupload = '';
					numberupload = 0;
					numbercheckupload = 0;
					return;
				  }
				
				  currentcommand = 0;
				  currentpathupload = '';
				  numberupload = 0;
				  numbercheckupload = 0;
				  let token = req.body.uploadtoken;
				  let currentdir = req.body.uploadpath;

				  console.log("upload ok!token:"+token+" currentdir:"+currentdir.hexDecode());
				  fs.readFile(__dirname + '/uploadfile_result.html', function (err,html) {
						 if (err) {
							throw err; 
						 }  
						 res.setHeader('content-type', 'text/html');
						 res.write(html);  
						 if(currentdir=='')
							res.write('<h2>/</h2>');
						 else 
							res.write('<h2>' + currentdir.hexDecode() + '</h2>');
						 res.write('<h2><input type=button id="upload" onclick="continueupload()" value="Continue Upload"/></h2>');
						 res.write('<table id="myTable"><thead><tr><th><p>Upload List</p></th><th></th><th><a>&nbsp;&nbsp;&nbsp;&nbsp;</a></th>');
						 res.write('</tr></thead><tbody>');
					
						 //console.log(files.length);
						 //console.log(files[0]);
						 
						 for (let i = 0; i < files.length; i++) {
									res.write('<tr class="file" id = "tr ' + (i+1) + '" style="border-bottom: 1px solid #000;">');
									res.write('<td class="td1"><p>'+ files[i].originalname + '</p></td>');
									res.write('<td class="td2"><img src="./images/done.png" ></img></td>');
									res.write('<td></td>');
									res.write('</tr>');
						 }
						
						 res.write('</tbody></table>');
						 res.write('<input type="hidden" id="token" name="token" value="'+token+'">');
						 res.write('<input type="hidden" id="path" name="path" value="'+currentdir+'">');
						 res.write('</div></body></html>');
						 res.end();
					});
				 }); 
				 
		  //}, 2000);//end timeout   
	}); //end await
});

 
/**************
 * Download *
 **************/
app.get('/startdownlink', function(req ,res) {
    console.log('start download from link for File:' + req.url);
    let data = req.query.data;
    data = crypto.decryptfromtext(data)
    console.log("data:" + data);
    let token = data.substring(0,data.indexOf("/"));
    let currentdir = data.substring(data.indexOf("/"),data.lastIndexOf("/"));
    let fname = data.substring(data.lastIndexOf("/")+1);
    console.log("token:" + token);
    console.log("curdir:" + currentdir);
    console.log("fname:" + fname);
    
    if(fname==''){
		res.send("Filename is empty!");
		return;
	}
	
	//check valid token
	if(checkvalidtoken_downfromlink(token,res)===false)
		return;
		

	const onefile = resDir + currentdir + '/'+fname;
	res.download(onefile, function (err) {
		if (err) {
			// Handle error, but keep in mind the response may be partially-sent
			// so check res.headersSent
			if(res.headersSent===true){
				console.log("finish download 5");

			}
			else{
				console.log("download not finished yet due to error occured! 625");

			}
		} else {
			// decrement a download credit, etc.
			console.log("finish download 6");

		}
	});
	 
	 
});

app.get('/downlink', function(req ,res) {
    console.log('download from link for File:' + req.url);
    let data = req.query.data;
    data = crypto.decryptfromtext(data)
    console.log("data:" + data);
    let token = data.substring(0,data.indexOf("/"));
    let currentdir = data.substring(data.indexOf("/"),data.lastIndexOf("/"));
    let fname = data.substring(data.lastIndexOf("/")+1);
    console.log("token:" + token);
    console.log("curdir:" + currentdir);
    console.log("fname:" + fname);
    
    if(fname==''){
		res.send("Filename is empty!");
		return;
	}
	
	//check valid token
	if(checkvalidtoken_downfromlink(token,res)===false)
		return;
		

	
	 res.setHeader('content-type', 'text/html;charset=utf-8');
	 res.write('<html>');
	 res.write('<head>');
	 res.write('<style>');
	 res.write('html { height:100%; }');
	 res.write('body { position:absolute; top:0; bottom:0; right:0; left:0; }');
	 res.write('textarea { position:absolute; width: 100%;height: 90%; }');
	 res.write('</style>');
	 res.write('<script>');
	 res.write('function download(){');
	 res.write("window.location.href='./startdownlink?data="+ req.query.data +"';}");
	 res.write('</script>');
	 res.write('</head>');
	 res.write('<body>');
	 res.write('<div>');
	 res.write('<br><br><br><p> Download file '+fname+'?</p> ');
	 res.write('</div>');
	 res.write('<div><input type=button id="download"  value="Download" onclick = "download()"><div>');
	 res.write('</body>');
	 res.write('</html>');
	 res.end();
	 

	 
});

app.get('/gendownlink', function(req ,res) {
    console.log('gendownlink for File:' + req.url);
	let token = req.query.token;
	let currentdir = req.query.currentdir;
	let fname = req.query.fname;
	fname = fname.trim().hexDecode();
	currentdir = currentdir.trim().hexDecode();
	console.log("token:" + token);
	console.log("currentdir:" + currentdir);
	console.log("fname:" + fname);
	
	//if(currentdir=='')
	console.log('file need to down:' + (resDir + currentdir + '/' + fname));
	
	if(fname==''){
		res.send("Filename is empty!");
		return;
	}
	
	//check valid token
	if(checkvalidtoken(token,res)===false)
		return;
	
	//check valid time
	if(checkvalidtime(res)===false)
		return;
	
	if(currentcommand != 0){
	  res.send("Server is busy! line 643");
	  return;
	}
	

	 var input = ''+token+currentdir + '/' + fname;
	 var output = myday.generatedownlink(input);
	

	 res.setHeader('content-type', 'text/html;charset=utf-8');
	 res.write('<html>');
	 res.write('<head>');
	 res.write('<style>');
	 res.write('html { height:100%; }');
	 res.write('body { position:absolute; top:0; bottom:0; right:0; left:0; }');
	 res.write('textarea { position:absolute; width: 100%;height: 90%; }');
	 res.write('</style>');
	 res.write('<script>');
	 res.write('function logout(){');
	 res.write('window.location.href=\'./logout?p=\'+ document.getElementById("token").value + \':\';}');
	 res.write('function back(){');
	 res.write('window.location.href=\'./path?p=\'+ document.getElementById("token").value + \':\' + document.getElementById("path").value;}');
	 res.write('</script>');
	 res.write('</head>');
	 res.write('<body>');
	 res.write('<div><input type=button id="logout"  value="Logout" onclick = "logout()">');
	 res.write('<input type=button id="back"  value="Back" onclick = "back()"></div>');
	 
	 res.write('<div>');
	 res.write('<br><br><br><a href="./downlink?data='+output.encryptedData+'"> https://'+req.hostname+'/downlink?data='+output.encryptedData+'</a> ');
	 res.write('</div>');
	 
	 res.write('<input type="hidden" id="token" name="token" value="'+token+'">');
	 res.write('<input type="hidden" id="path" name="path" value="'+currentdir.hexEncode()+'">');	 
	 res.write('</body>');
	 res.write('</html>');
	 res.end();
	 

	 
});

app.get('/download', (req, res) => {
    console.log('Download File ' + req.url);
    let p = querystring.parse(req.url)['/download?p'];
	let token = p.substring(0,p.indexOf(":"));
	p = p.substring(p.indexOf(":")+1,p.length);
	let p1 = p.substring(0,p.indexOf("-"));
	p1 = p1.hexDecode();
	let p2 = p.substring(p.indexOf("-")+1,p.length);
	p2 = p2.hexDecode();
	p = p1 + '' + p2;
	console.log("path:" + p);
	console.log("token:" + token);
	let ways = p.split(":");
	
	let onlyfile = false;
	
	if((ways.length==2) &&(ways[1].charAt(0)!='/')){
		onlyfile = true;
		ways[1] = "/" + ways[1];
	}
	else{
		for(i in ways)
			if((ways[i]!='')&&(ways[i].charAt(0)!='/'))
				ways[i] = "/" + ways[i];
	}
	
	//for(i in ways)
	//	console.log(ways[i]);

    
    //check valid token
	if(checkvalidtoken(token,res)===false)
		return;
	
	//check valid time
	if(checkvalidtime(res)===false)
		return;
	
	if(currentcommand != 0){
		res.send('Server is busy!');
		return;
	}
	
	
	if(onlyfile==true)//chi co 1 file duoc chon
	{
		const onefile = resDir + ways[0] + ways[1];
		currentcommand = 1;
		console.log("onefile path:" + onefile);
		res.download(onefile, function (err) {
			if (err) {
				// Handle error, but keep in mind the response may be partially-sent
				// so check res.headersSent
				if(res.headersSent===true){
					console.log("finish download 3");
					currentcommand = 0;
				}
				else{
					console.log("download not finished yet due to error occured! 34");
					currentcommand = 0;
				}
			} else {
				// decrement a download credit, etc.
				console.log("finish download 4");
				currentcommand = 0;
			}
		});
		
		return;
	}
	
	currentcommand = 1;
    let action1 = exec("bash " + rootDir + "/output/remove-zip-files.sh", function(err, stdout, stderr) {
		if (err) {
			// should have err.code here?  
			console.log(err);
			res.send('Error while executing command in server!');
			currentcommand = 0;
			return;
		}
		console.log(stdout);
		console.log("remove zipout.zip done!");
		
		let execpath = 'cd "' + resDir + ways[0].replace(/`/g, "\\`") + '"';
		
		let action2 = exec(execpath, function(err, stdout, stderr) {
			if (err) {
				// should have err.code here?  
				console.log(err);
				res.send('Error wrong path!');
				currentcommand = 0;
				return;
			}
		
			execpath = 'cd "' + resDir + ways[0].replace(/`/g, "\\`") + '";zip -r ' + rootDir + '/output/zipout.zip ';// + resDir;///home/dungnt/Desktop/Storage/www";

			for(i in ways)
				if(i!=0)
					execpath = execpath + '".' + ways[i].replace(/`/g, "\\`") + '" ';

			console.log("execpath:"+execpath);
			
			
			let action3 = exec(execpath, function(err, stdout, stderr) {
				if (err) {
					// should have err.code here?  
					console.log(err);
					res.send('Error while executing command in server!');
					currentcommand = 0;
					return;
				}
				console.log(stdout);
				console.log("compression done!");
				console.log(`Server running at: http://localhost:${PORT}/`);
				const file = rootDir + '/output/zipout.zip';
				res.download(file, function (err) {
					if (err) {
						// Handle error, but keep in mind the response may be partially-sent
						// so check res.headersSent
						if(res.headersSent===true){
							console.log("finish download 1");
							currentcommand = 0;
						}
						else{
							console.log("download not finished yet due to error occured! 12");
							currentcommand = 0;
						}
					} else {
						// decrement a download credit, etc.
						console.log("finish download 2");
						currentcommand = 0;
					}
				  })

			});//end action 3
		}); //end action 2
    }); //end action 1
}); //end download function

app.get('/nodejs_ajax',function(req,res){
	console.log('ajax request received');
	let p = querystring.parse(req.url)['/nodejs_ajax?p'];
	let token = p.substring(0,p.indexOf(":"));
	console.log("p:"+ p + " ajax token:" + token);
	
	//check valid token
	if(checkvalidtoken(token,res)===false)
		return;
		
	//check validtime
	if(checkvalidtime(res)===false)
		return;
		
    res.writeHead(200, {'Content-Type': 'text/plain'});
    
    /*
    let dir = exec("find " + rootDir + "/output -name zi*", function(err, stdout, stderr) {
  	if (err) {
    	// should have err.code here?  
		console.log(err);
  	}
		
		let s = stdout.toString();
		s = s.substring(s.lastIndexOf("/")+1,s.indexOf("."));
		console.log(s);
	    //res.end('_testcb(\'{"message": "'+s+'"}\')');
	    res.end('_testcb(\'{"'+s+'"}\')');
    });
    //res.end('_testcb(\'{"message": "Hello world!"}\')');
    * */
    
    if(currentcommand == 0){
	    res.end('_testcb(\'{"zipout"}\')');
	}
	else{
		res.end('_testcb(\'{"notout"}\')');
	}
    
});

/*************
 * Delete
 * **************/

app.get('/del', (req, res) => {
    console.log('Delete File ' + req.url);
    let token = req.query.token;
	let currentdir = req.query.currentdir;
	let dname = req.query.dname;
	dname = dname.trim().hexDecode();
	currentdir = currentdir.trim().hexDecode();
	console.log("token:" + token);
	console.log("currentdir:" + currentdir);
	console.log("dname:" + dname);
	
	let ways = dname.split(":");
	
	for(i in ways)
		console.log(ways[i]);

    
    //check valid token
	if(checkvalidtoken(token,res)===false)
		return;
	
	//check valid time
	if(checkvalidtime(res)===false)
		return;
	
	if (currentdir.trim().localeCompare("")==0){
		res.send("Can not delete in root folder!");
		return;
	}
	
	if(currentdir.trim().indexOf("/backup") != -1){
		res.send('Can not delete in backup folder!');
		return;
	}
	
    if(currentcommand != 0){
		res.send('Server is busy!');
		return;
	}
	
	//xu ly char ` gay loi khi thuc thi command tren bash server
	let  currentdir_run = currentdir.replace(/`/g, "\\`");
	
	currentcommand = 2;
	
	let execpath = 'cd "' + rootDir + '/output";rm deletefile_abcd.txt;';
	
	exec(execpath, function(err, stdout, stderr) {
		if(err){
			res.send('Error while executing command in server!');
			currentcommand = 0;
			return;
		}
		
		execpath = 'cd "' + rootDir + '/output";echo "del" >> deletefile_abcd.txt';
	
		exec(execpath, function(err, stdout, stderr) {
			if(err){
				res.send('Error while executing command in server!');
				currentcommand = 0;
				return;
			}
			
			execpath = 'cd "' + resDir + currentdir_run + '";';
			
			exec(execpath, function(err, stdout, stderr) {
				if (err) {
					// should have err.code here?  
					console.log(err);
					res.send('Error wrong path!');
					currentcommand = 0;
					return;
				}
				
				execpath = 'cd "' + resDir + currentdir_run + '";';
				for(i in ways){
					if(i!=0){
						//execpath = execpath + '';// + resDir;///home/dungnt/Desktop/Storage/www";
						ways[i]=ways[i].replace(/`/g, "\\`");
						if(ways[i].charAt(0)!='/')
							execpath = execpath + 'rm "./' + ways[i] + '";';
						else
							execpath = execpath + 'rm -r ".' + ways[i] + '";';
					}
				} //end for
				
				console.log("execpath:"+execpath);
				exec(execpath, function(err, stdout, stderr) {
					if (err) {
						// should have err.code here?  
						console.log(err);
						res.send('Error while executing command in server!');
						currentcommand = 0;
						return;
					}
					
					console.log(stdout);
					console.log("delete files done!");
					console.log(`Server running at: http://localhost:${PORT}/`);
					currentcommand = 0;
					let dirPath = abPath = parentPath = '';
					
					if(currentdir!=='') {
						dirPath = resDir + currentdir;
						abPath = currentdir;
						parentPath = abPath.substring(0,abPath.lastIndexOf('/'));
						console.log("del file - parentPath:" + parentPath);
						
						fs.readFile(__dirname + '/content.html', function (err,html) {
						 if (err) {
							throw err; 
						 }  
					 
						 try {
							res.setHeader('content-type', 'text/html');
							res.write(html); 
							writefirst(res, dirPath, token, false, parentPath, abPath);
						 }
						 catch(e)
						 {
							 try {
								res.send('Error');
							 }
							 catch(e)
							 {
								console.log("Loi 3 " + e);
							 }
						 }
					  }); 
					}
					else {
						 fs.readFile(__dirname + '/content.html', function (err,html) {
							if (err) {
								throw err; 
							}  
							try {
								 res.setHeader('content-type', 'text/html');
								 res.write(html);  
								 writefirst(res,resDir,token, true, parentPath, abPath);
							 }
							 catch(e)
							 {
								 try {
									res.send('Error');
								 }
								 catch(e)
								 {
									console.log("Loi 4 " + e);
								 }
							 }
						 });
						 return;
					}
						
				});//end action 
			});//end first action
		});
	});
    
}); //end

app.get('/nodejs_ajax_del',function(req,res){
	console.log('ajax delete request received');
	let p = querystring.parse(req.url)['/nodejs_ajax_del?p'];
	let token = p.substring(0,p.indexOf(":"));
	console.log("p:"+ p + " ajax token:" + token);
	
	//check valid token
	if(checkvalidtoken(token,res)===false){
		console.log("invalid ajax token");
		return;
	}
		
	//check validtime
	if(checkvalidtime(res)===false)
		return;
		
    res.writeHead(200, {'Content-Type': 'text/plain'});
    
    /*
    let dir = exec("find " + rootDir + "/output -name deletefile_abcd.txt", function(err, stdout, stderr) {
  	if (err) {
    	// should have err.code here?  
		console.log(err);
  	}
		
		let s = stdout.toString();
		s = s.substring(s.lastIndexOf("/")+1,s.indexOf("."));
		console.log(s);
	    //res.end('_testcb(\'{"message": "'+s+'"}\')');
	    res.end('_testcb(\'{"'+s+'"}\')');
    });
    //res.end('_testcb(\'{"message": "Hello world!"}\')');
    * */
    
    if(currentcommand == 0){
	    res.end('_testcb(\'{"deletefile_abcd"}\')');
	}
	else{
		res.end('_testcb(\'{"deletefile_notfinish"}\')');
	}
});

/*********
 * Rename
 * *************/
 
 app.get('/rename', (req, res) => {
    console.log('Rename ' + req.url);
	let token = req.query.token;
	let currentdir = req.query.currentdir;
	let dname = req.query.dname;
	let oname = req.query.oname;
	
	let dirPath = resDir;
	let abPath = '';
	let parentPath = '';
	
	dname = dname.trim().hexDecode();
	oname = oname.trim().hexDecode();
	currentdir = currentdir.trim().hexDecode();
	console.log("token:" + token);
	console.log("currentdir:" + currentdir);
	console.log("newname:" + dname);
	console.log("oldname:" + oname);
	
    //check valid token
	if(checkvalidtoken(token,res)===false)
		return;
	
	//check valid time
	if(checkvalidtime(res)===false)
		return;
		
	if (currentdir.trim().localeCompare("")==0){
		res.send("Can not rename in root folder!");
		return;
	}
	
	if(currentdir.trim().indexOf("/backup") != -1){
		res.send('Can not rename in backup folder!');
		return;
	}
	
    if(currentcommand != 0){
		res.send('Server is busy!');
		return;
	}
	

	if((dname=='')||(oname=='')){ 
		res.send('Name is invalid!');
		return;
	}

	//xu ly char ` gay loi khi thuc thi command tren bash server
	let currentdir_disp=currentdir;
	let oname_disp=oname;
	let dname_disp=dname;
	dname = dname.replace(/`/g, "\\`");
	oname = oname.replace(/`/g, "\\`");
	currentdir = currentdir.replace(/`/g, "\\`");
	
	currentcommand = 6;
	
	let execpath1 = 'find "'+resDir + currentdir + '/" -maxdepth 1 -name "'+ oname + '"';
	
	console.log("execpath1:"+execpath1);

	let action1 = exec(execpath1, function(err, stdout, stderr) {
		if (err) {
			// should have err.code here?  
			console.log(err);
			res.send("Error, path is wrong.");
			currentcommand = 0;
			return;
		}
		
		let s = stdout.toString();
		s = s.substring(s.lastIndexOf("/")+1,s.length);
		//console.log("s:"+s.trim());
		//console.log("oname:"+oname.trim());
		if(s.trim()!=oname_disp.trim()){	
			currentcommand = 0;
			res.send("Item does not exist.");
			return;
		}
			
		let execpath2 = 'find "' + resDir + currentdir + '/" -maxdepth 1 -name "'+ dname + '"';
	
		console.log("execpath2:"+execpath2);
		
		let action2 = exec(execpath2, function(err, stdout, stderr) {
			if (err) {
				// should have err.code here?  
				console.log(err);
				res.send("Error in server side.");
				currentcommand = 0;
				return;
			}
			//console.log(stdout);
			let s = stdout.toString();
			s = s.substring(s.lastIndexOf("/")+1,s.length);
			//console.log(s);
			if(s.trim()==dname_disp.trim()){	
				currentcommand = 0;
				res.send("NewName exists.");
				return;
			}
			
			//console.log("-------rename find done!");
			let execpath3 = 'mv "' + resDir + currentdir + '/' + oname +'" "' + resDir + currentdir + '/' + dname+'";';
			console.log('execpath3: ' + execpath3);
			
			
			let action3 = exec(execpath3, function(err, stdout, stderr) {
				if (err) {
					// should have err.code here?  
					console.log(err);
					res.send("Error in server side.");
					currentcommand = 0;
					return;
				}
				
				console.log("-------rename successful!");
				currentcommand = 0;
			
				if(currentdir==''){
					fs.readFile(__dirname + '/content.html', function (err,html) {
						if (err) {
							throw err; 
						}  
						 res.setHeader('content-type', 'text/html');
						 res.write(html);  
						 writefirst(res,resDir,token, true, parentPath, abPath);
					 });
				}
				else{
					dirPath = resDir + currentdir_disp;
					abPath = currentdir_disp;
					parentPath = abPath.substring(0,abPath.lastIndexOf('/'));
						
					console.log("rename parentPath:" + parentPath);	
					console.log("rename abPath:" + abPath);
					console.log("rename dirPath:" + dirPath);
		
					fs.readFile(__dirname + '/content.html', function (err,html) {
						if (err) {
							throw err; 
						}  
						 res.setHeader('content-type', 'text/html');
						 res.write(html);  
						 writefirst(res, dirPath, token, false, parentPath, abPath);
					 });
				}
			});//end action 3
			
		});//end action 2
	});//end action 1
}); //end
 
/*********
 * Make New Dir
 * *************/


app.get('/mkdir', (req, res) => {
    console.log('MkDir ' + req.url);
	let token = req.query.token;
	let currentdir = req.query.currentdir;
	let dname = req.query.dname;
	
	let dirPath = resDir;
	let abPath = '';
	let parentPath = '';
	
	dname = dname.trim().hexDecode();
	currentdir = currentdir.trim().hexDecode();
	console.log("token:" + token);
	console.log("currentdir:" + currentdir);
	console.log("dname:" + dname);
	
	
    //check valid token
	if(checkvalidtoken(token,res)===false)
		return;
	
	//check valid time
	if(checkvalidtime(res)===false)
		return;
	
	if (currentdir.trim().localeCompare("")==0){
		res.send("Can not mkdir in root folder!");
		return;
	}
	
	if(currentdir.trim().indexOf("/backup") != -1){
		res.send('Can not mkdir in backup folder!');
		return;
	}
	
    if(currentcommand != 0){
		res.send('Server is busy!');
		return;
	}
	

	if(dname==''){ 
		res.send('Name is invalid!');
		return;
	}

	//xu ly char ` gay loi khi thuc thi command tren bash server
	let currentdir_disp=currentdir;
	let dname_disp=dname;
	dname = dname.replace(/`/g, "\\`");
	currentdir = currentdir.replace(/`/g, "\\`");
	
	currentcommand = 3;
	
	let execpath1 = 'cd "' + resDir + currentdir + '";';

	console.log("execpath1:"+execpath1);

	let action1 = exec(execpath1, function(err, stdout, stderr) {
		if (err) {
			// should have err.code here?  
			console.log(err);
			res.send("Error, path is wrong.");
			currentcommand = 0;
			return;
		}
		
		let execpath2 = execpath1 + 'mkdir "./' + dname + '";sudo chgrp -R restriction "./'+dname+'";sudo chown -R store "./'+dname+'";';

		console.log("execpath2:"+execpath2);
		/*	
		//let CmdObj = { "timestamp":"" + (new Date().getTime()),"id":"3", "cmd":"mkdir", "dir":''+resDir + currentdir+'',"name":dname };
		
		let CmdObj_IpC = { "clientid":"1","timestamp":"" + (new Date().getTime()),"id":"3", "cmd":"mkdir", "dir":''+currentdir,"name":dname, "stimestamp":"0", "execres" : "1", "other" : "none" };
		
		makeDirByIpc(CmdObj_IpC).then(function(value) {
			if(value.trim()=="3 success"){
					console.log("mkdir done!");
					console.log(`Server running at: http://localhost:${PORT}/`);
					currentcommand = 0;
					
					if(currentdir==''){
						fs.readFile(__dirname + '/content.html', function (err,html) {
							if (err) {
								throw err; 
							}  
							 res.setHeader('content-type', 'text/html');
							 res.write(html);  
							 writefirst(res,resDir,token, true, parentPath, abPath);
						 });
					}
					else{
						dirPath = resDir + currentdir;
						abPath = currentdir;
						parentPath = abPath.substring(0,abPath.lastIndexOf('/'));
							
						console.log("mkdir parentPath:" + parentPath);	
						console.log("mkdir abPath:" + abPath);
						console.log("mkdir dirPath:" + dirPath);
			
						fs.readFile(__dirname + '/content.html', function (err,html) {
							if (err) {
								throw err; 
							}  
							 res.setHeader('content-type', 'text/html');
							 res.write(html);  
							 writefirst(res, dirPath, token, false, parentPath, abPath);
						 });
					}
			}
			else{
				res.send("Error, may be directory created before.");
				currentcommand = 0;
			}
			
		});
		*/
		
		let action2 = exec(execpath2, function(err, stdout, stderr) {
			if (err) {
				// should have err.code here?  
				console.log(err);
				res.send("Error, may be directory created before.");
				currentcommand = 0;
				return;
			}
			console.log(stdout);
			console.log("mkdir done!");
			console.log(`Server running at: http://localhost:${PORT}/`);
			currentcommand = 0;
			
			if(currentdir==''){
				fs.readFile(__dirname + '/content.html', function (err,html) {
					if (err) {
						throw err; 
					}  
					 res.setHeader('content-type', 'text/html');
					 res.write(html);  
					 writefirst(res,resDir,token, true, parentPath, abPath);
				 });
			}
			else{
				dirPath = resDir + currentdir_disp;
				abPath = currentdir_disp;
				parentPath = abPath.substring(0,abPath.lastIndexOf('/'));
					
				console.log("mkdir parentPath:" + parentPath);	
				console.log("mkdir abPath:" + abPath);
				console.log("mkdir dirPath:" + dirPath);
	
				fs.readFile(__dirname + '/content.html', function (err,html) {
					if (err) {
						throw err; 
					}  
					 res.setHeader('content-type', 'text/html');
					 res.write(html);  
					 writefirst(res, dirPath, token, false, parentPath, abPath);
				 });
			}
		});//end action 2
		
	});//end action 1

}); //end


/********
 * REFRESH DIRECTORY  *
 * **********/
 
 app.get('/refresh', function(req ,res) {
	console.log('Refresh directory');
	let token = req.query.token;
	let p = req.query.currentdir;
	
	p = p.trim().hexDecode();
	console.log("token:" + token);
	console.log("currentdir:" + p);
	
	let dirPath = resDir;
	let abPath = '';
	let parentPath = '';
	
	if(currentcommand != 0){
	  res.send("Server is busy! line 1300");
	  return;
	}
 
	//check valid token
	if(checkvalidtoken(token,res)===false)
		return;
	
	//check valid time
	if(checkvalidtime(res)===false)
		return;
		
	if(p!=='') {
		dirPath = resDir + p;
		abPath = p;
		parentPath = abPath.substring(0,abPath.lastIndexOf('/'));
		console.log("parentPath:" + parentPath);
		//xu ly char ` gay loi run exec in bash phia server
		p=p.replace(/`/g, "\\`");
	}
	else {
		 fs.readFile(__dirname + '/content.html', function (err,html) {
			if (err) {
				throw err; 
			}  
			 res.setHeader('content-type', 'text/html');
		     res.write(html);  
		     writefirst(res,resDir,token, true, parentPath, abPath);
		 });
		 return;
	}

     console.log("try:"+'cd ' + '"'+ resDir + p + '"');
	let action = exec('cd ' + '"'+ resDir + p + '"', function(err, stdout, stderr) {
		if (err) {
			// should have err.code here?  
			console.log('err:'+err);
			res.send("Error, wrong path");
			return;
		}
		
		fs.readFile(__dirname + '/content.html', function (err,html) {
			 if (err) {
				throw err; 
			 }  
		 
			 try {
				res.setHeader('content-type', 'text/html');
				res.write(html); 
				writefirst(res, dirPath, token, false, parentPath, abPath);
			 }
			 catch(e)
			 {
					res.send('Error');
					console.log('Loi 3');
			 }
	  });
   });//end action
});
 


/*********
 * List Dir
 * *************/


app.get('/path',function(req,res){
	console.log('List directory');
	let p = querystring.parse(req.url)['/path?p'];
	let dirPath = resDir;
	let abPath = '';
	let parentPath = '';
	let token = p.substring(0,p.indexOf(":"));
	p = p.substring(p.indexOf(":")+1,p.length);
	p = p.trim().hexDecode();

	console.log("path:" + p);
	console.log("token:" + token);
	
	//check valid token
	if(checkvalidtoken(token,res)===false)
		return;
	
	//check valid time
	if(checkvalidtime(res)===false)
		return;
		
	
	if(p!=='') {
		dirPath = resDir + p;
		abPath = p;
		parentPath = abPath.substring(0,abPath.lastIndexOf('/'));
		console.log("dirpath:"+dirPath);
		console.log("parentPath:"+parentPath);
		console.log("abPath:"+abPath);
		//xu ly char ` gay loi run exec in bash phia server
		p=p.replace(/`/g, "\\`");
	}
	else {
		 fs.readFile(__dirname + '/content.html', function (err,html) {
			if (err) {
				throw err; 
			}  
			 res.setHeader('content-type', 'text/html');
		     res.write(html);  
		     writefirst(res,resDir,token, true, parentPath, abPath);
		 });
		 return;
	}

     console.log("try:"+'cd ' + '"'+ resDir + p + '"');
	let action = exec('cd ' + '"'+ resDir + p + '"', function(err, stdout, stderr) {
		if (err) {
			// should have err.code here?  
			console.log('err:'+err);
			res.send("Error, wrong path");
			return;
		}
		
		fs.readFile(__dirname + '/content.html', function (err,html) {
			 if (err) {
				throw err; 
			 }  
		 
			 try {
				res.setHeader('content-type', 'text/html');
				res.write(html); 
				//console.log("day");
				writefirst(res, dirPath, token, false, parentPath, abPath);
			 }
			 catch(e)
			 {
					res.send('Error');
					console.log('Loi 3');
			 }
	  });
   });//end action
});

/*********
 * Options
 * *************/

app.get('/option', function(req ,res) {
	console.log('Select Option');
	let token = req.query.token;
	let p = req.query.currentdir;
	
	p = p.trim().hexDecode();
	console.log("token:" + token);
	console.log("currentdir:" + p);
	
	
	if(currentcommand != 0){
	  res.send("Server is busy! line 1300");
	  return;
	}
 
	//check valid token
	if(checkvalidtoken(token,res)===false)
		return;
	
	//check valid time
	if(checkvalidtime(res)===false)
		return;
		
	
	 fs.readFile(__dirname + '/optionfile.html', function (err,html) {
		if (err) {
			throw err; 
		}  
		 res.setHeader('content-type', 'text/html');
		 res.write(html); 
		 res.write('<h3>Shared Folder Size: 64 G</h3>');
		 res.write('<h3>Backup Folder Size: 64 G</h3>');
		 res.write('<input type="hidden" id="token" name="token" value="'+token+'">');
		 res.write('<input type="hidden" id="path" name="path" value="'+p.hexEncode()+'">');	 
		 res.write('</div>');
		 res.write('</body>');
		 res.write('</html>');
		 res.end();
	 });
	

});

/*********
 * Other Functions
 * *************/
 

function PromiseTimeout(ms) { 
        return new Promise(function(resolve, reject) { 
            // Setting 2000 ms time 
            setTimeout(resolve, ms); 
        }).then(function() { 
            //console.log("Wrapped setTimeout after 2000ms"); 
        }); 
} 

function getFileAndDirectories(path) {
	return fs.readdirSync(path,{withFileTypes:true})
}

//console.log(getFileAndDirectories(resDir))

function writefirst(res,rDir,token,firstcall, pPath, aPath){
		let files = getFileAndDirectories(rDir);
		let k = -1;
		
		 if(firstcall==false){
			 if(files.length > 0)
					res.write('<th style="width: 100px; height: 25px;"><button type="button" id = "selectbutton" class="btun" onclick="selectall()">Select All</button></th>');
			 else
					res.write('<th style="width: 100px; height: 25px;"><button type="button" id = "selectbutton" class="btun"> </button></th>');
		 }
		 else
			res.write('<th style="width: 100px; height: 25px;"><button type="button" id = "selectbutton" class="btun"> </button></th>');
			
		 res.write('</tr>');
		 res.write('</thead>');
		 res.write('<tbody>');
		 
		 if(firstcall==false){
			 res.write('<tr class="dir" style="border-bottom: 1px solid #000;">');
			 res.write('<td><a href="./path?p=' + token + ":" + pPath.trim().hexEncode() + '">'+ '..' + '</a></td>');
			 res.write('<td><a href="./path?p=' + token + ":" + pPath.trim().hexEncode() + '">'+ '' + '</a></td>');
			 res.write('</tr>');
		 }
		 
		 let tempPath='';
		 for (let i = 0; i < files.length; i++) {
			if(files[i].isDirectory()){
					k++;
					if(firstcall==false){
						res.write('<tr class="dir" id = "tr ' + (k+1) + '" style="border-bottom: 1px solid #000;">');
						tempPath = aPath + '/' +files[i].name;
						res.write('<td><a href="./path?p=' + token + ":" + tempPath.trim().hexEncode() +'" class="my-link">'+ files[i].name + '</a></td>');
						res.write('<td><input type="checkbox" class="cbox" id = "cbox ' + (k+1) + '" name = "/' + files[i].name + '" onclick="terms_change(this)"></input></td>');
						res.write('</tr>');
					}
					else{
						res.write('<tr class="dir" id = "tr ' + (k+1) + '" style="border-bottom: 1px solid #000;">');
						tempPath = aPath + '/' +files[i].name;
						res.write('<td><a href="./path?p=' + token + ":" + tempPath.trim().hexEncode() +'" class="my-link">'+ files[i].name + '</a></td>');
						res.write('<td></td>');
						res.write('</tr>');
					}
			}
		}
		
		for (let i = 0; i < files.length; i++) {
			if(!files[i].isDirectory()){
					k++;
					res.write('<tr class="file" id = "tr ' + (k+1) + '" style="border-bottom: 1px solid #000;">');
					res.write('<td><p>'+ files[i].name + '</p></td>');
					res.write('<td><input type="checkbox" class="cbox" id = "cbox ' + (k+1) + '" name = "' + files[i].name + '" onclick="terms_change(this)"></input></td>');
					res.write('</tr>');
			}
		 }

		 res.write('</tbody>');
		 res.write('</table>');
		 //console.log("firstcall=" + firstcall);
		 if(firstcall==true){
			 res.write('<input type="hidden" id="path" name="path" value="">');
		 }
		 else {
			 res.write('<input type="hidden" id="path" name="path" value="'+aPath.hexEncode()+'">');
		 }
		 
		 res.write('<input type="hidden" id="maxnum" name="maxnum" value="'+files.length+'">');
		 res.write('<input type="hidden" id="token" name="token" value="'+token+'">');
		 res.write('</div>');
		 res.write('</body>');
		 res.write('</html>');
		 res.end();
}

function checkvalidtime(res){
	let newvalidtime = new Date().getTime();
	if((newvalidtime - validtime)/1000 > 300)
	{
		try {
				res.send('Error: Timeout, please relogin!');
		 }
		 catch(e){
			console.log("Loi timeout " + e);
		 }
		
		return false;
	}
	//save new time
	validtime = newvalidtime;
	//write time to log for bash copy process
	updatelogtime(false);
	return true;
}

function checkvalidtoken(token,res){
	if(token==='')
	{
		res.send('Error: token');
		return false;
	}
	
	try {
		let cleartoken = crypto.decryptfromtext(token);
		//console.log("clear token:" + cleartoken);
		let compareday = myday.checkexprire(cleartoken);
		//console.log("compareday:" + compareday);
		
		if(compareday === true)
		{
			res.send('Error token');
			return false;
		}
		
		compareday = myday.checklogout(cleartoken,logouttime);
		if(compareday === true)
		{
			res.send('Error token');
			return false;
		}
	 }
	 catch(e){
			res.send('Error token');
			return false;
	 }

	return true;
}

function checkvalidtoken_downfromlink(token,res){
	if(token==='')
	{
		res.send('Error: token');
		return false;
	}
	
	try {
		let cleartoken = crypto.decryptfromtext(token);
		//console.log("clear token:" + cleartoken);
		let compareday = myday.checkexprire(cleartoken);
		//console.log("compareday:" + compareday);
		
		if(compareday === true)
		{
			res.send('Error token');
			return false;
		}
		
	 }
	 catch(e){
			res.send('Error token');
			return false;
	 }

	return true;
}

function updatelogtime(bl){

	let data = Date.now()+"\n";
	
	if(bl===true){
		// Write first data in 'read_file.txt
		fs.writeFile('./logtime/logtimefile.txt', data, (err) => {
			  
			// In case of a error throw err.
			if (err) throw err;
		})
	}
	else{
		// Append data in 'read_file.txt
		fs.appendFile('./logtime/logtimefile.txt', data, (err) => {
			  
			// In case of a error throw err.
			if (err) throw err;
		})
	}
}

/**
 * https://medium.com/@ali.dev/how-to-use-promise-with-exec-in-node-js-a39c4d7bbf77
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
 
function execShellCommand(cmd) {
	 return new Promise((resolve, reject) => {
		  exec(cmd, (error, stdout, stderr) => {
			   let out = '';
			   if (error) {
					console.warn("ErrorExecShellCommand:" + error);
					out = 'err';
			   }
			   else{
				   if(stdout!='')
						out = stdout;
					console.warn(stderr);
			   }   
			   //resolve(stdout? stdout : stderr);
			   resolve(out);
		  });
	 });
}

String.prototype.hexDecode = function(){
    var j;
    var hexes = this.match(/.{1,4}/g) || [];
    var back = "";
    for(j = 0; j<hexes.length; j++) {
        back += String.fromCharCode(parseInt(hexes[j], 16));
    }

    return back;
}

String.prototype.hexEncode = function(){
    var hex, i;

    var result = "";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }

    return result
}
