// ライブラリの読み込み  
var usb = require('usb');
var rest = require('restler');
var async = require('async');



// vid, pid を指定してデバイスをオープン
var dev = usb.findByIds(0x046d,0xc29a);
dev.open();

// interfaceを宣言                                        
dev.interfaces[0].claim();
var inEndpoint = dev.interfaces[0].endpoints[0];
inEndpoint.startPoll(3,64)


var params = [0,0];

async.forever(function(callback){

  inEndpoint.transfer(64, function (error, data){

    if (!error) {
	    var ab = conv2int(data);
	    var l = acbr2logic(ab[0], ab[1], ab[2]);

	    if(params.toString() != l.toString()){
		    sendGet(l[0], l[1]);
		    console.log(l[0], l[1]);
	    }
	    params = l;

	  } else {
//	    console.log(error);
	  }
  });

  setTimeout(callback, 10);

}, function(err){
  console.log(err);
});


//USB機器から受け取ったアクセルとブレーキの値を0-1に変換
//"<Buffer 08 00 00 5e d0 1f 00 ff 80>" 7番目アクセル, 8番目ブレーキ
function conv2int(data){

    var back;
    var in1 = 255-data[6]; // アクセル
    var in2 = 255-data[7]; // ブレーキ

    data[0] == 136 ? back=1 : back=0;

    ac = Math.floor(in1*10/232)/10
    br = Math.floor(in2*10/232)/10

    return [ac,br,back];
}

function acbr2logic(ac,br,back){
  var in1, in2

  if(br > 0){
    in1 = br; in2 = br;
  } else if (back == 1){
    in1 = 0; in2 = ac;
  } else {
    in1 = ac; in2 = 0;
  }

  return [in1, in2];
}

// アクセルとブレーキの値を受け取ってGetで送る関数
function sendGet(in1,in2){
    rest.get('http://192.168.1.15:9001?in1='+in1+'&in2='+in2);
    rest.get('http://localhost:9001?in1='+in1+'&in2='+in2);
}
