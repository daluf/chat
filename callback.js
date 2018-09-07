// console.log("file beginning");

// function doSomeAsyncWork(callback) {
// 	console.log("work starting");

// 	setTimeout(function() {
// 		console.log("work finished");
// 		callback(null, "SOME-DATA");
// 	}, 5000);

// 	console.log("work starting 2");
// }


// doSomeAsyncWork(function (err, data) {
// 	console.log("woho. i have my data", data);
// });

// console.log("file end");


function namedCallback(){
	// alert(“namedCallback()”);
	console.log("test-2");
 }
 function testFunction(tete){
	console.log("test-1");
	// tete(false);
 }
 testFunction(namedCallback);
