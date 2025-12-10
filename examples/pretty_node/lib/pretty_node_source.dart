
import 'dart:async';
import 'dart:convert';
import 'package:globe_runtime/globe_runtime.dart' as runtime;

const packageVersion = '1.0.0';
const packageSource = r'''
var I=Object.defineProperty;var D=Object.getOwnPropertySymbols;var F=Object.prototype.hasOwnProperty,p=Object.prototype.propertyIsEnumerable;var B=(e,t,n)=>t in e?I(e,t,{enumerable:true,configurable:true,writable:true,value:n}):e[t]=n,m=(e,t)=>{for(var n in t||(t={}))F.call(t,n)&&B(e,n,t[n]);if(D)for(var n of D(t))p.call(t,n)&&B(e,n,t[n]);return e};var w=["B","kB","MB","GB","TB","PB","EB","ZB","YB"],L=["B","KiB","MiB","GiB","TiB","PiB","EiB","ZiB","YiB"],Y=["b","kbit","Mbit","Gbit","Tbit","Pbit","Ebit","Zbit","Ybit"],k=["b","kibit","Mibit","Gibit","Tibit","Pibit","Eibit","Zibit","Yibit"],T=(e,t,n)=>{let s=e;return typeof t=="string"||Array.isArray(t)?s=e.toLocaleString(t,n):(t===true||n!==void 0)&&(s=e.toLocaleString(void 0,n)),s},x=e=>{if(typeof e=="number")return Math.log10(e);let t=e.toString(10);return t.length+Math.log10("0."+t.slice(0,15))},P=e=>typeof e=="number"?Math.log(e):x(e)*Math.log(10),U=(e,t)=>{if(typeof e=="number")return e/t;let n=e/BigInt(t),s=e%BigInt(t);return Number(n)+Number(s)/t};function y(e,t){if(typeof e!="bigint"&&!Number.isFinite(e))throw new TypeError(`Expected a finite number, got ${typeof e}: ${e}`);t=m({bits:false,binary:false,space:true},t);let n=t.bits?t.binary?k:Y:t.binary?L:w,s=t.space?" ":"";if(t.signed&&(typeof e=="number"?e===0:e===BigInt(0)))return ` 0${s}${n[0]}`;let c=e<0,b=c?"-":t.signed?"+":"";c&&(e=-e);let i;if(t.minimumFractionDigits!==void 0&&(i={minimumFractionDigits:t.minimumFractionDigits}),t.maximumFractionDigits!==void 0&&(i=m({maximumFractionDigits:t.maximumFractionDigits},i)),e<1){let a=T(e,t.locale,i);return b+a+s+n[0]}let o=Math.min(Math.floor(t.binary?P(e)/Math.log(1024):x(e)/3),n.length-1);e=U(e,(t.binary?1024:1e3)**o),i||(e=e.toPrecision(3));let d=T(Number(e),t.locale,i),h=n[o];return b+d+s+h}var E=e=>Number.isFinite(e)?e:0;function Z(e){return {days:Math.trunc(e/864e5),hours:Math.trunc(e/36e5%24),minutes:Math.trunc(e/6e4%60),seconds:Math.trunc(e/1e3%60),milliseconds:Math.trunc(e%1e3),microseconds:Math.trunc(E(e*1e3)%1e3),nanoseconds:Math.trunc(E(e*1e6)%1e3)}}function $(e){return {days:e/BigInt(86400000),hours:e/BigInt(3600000)%BigInt(24),minutes:e/BigInt(60000)%BigInt(60),seconds:e/BigInt(1000)%BigInt(60),milliseconds:e%BigInt(1000),microseconds:BigInt(0),nanoseconds:BigInt(0)}}function M(e){switch(typeof e){case "number":{if(Number.isFinite(e))return Z(e);break}case "bigint":return $(e)}throw new TypeError("Expected a finite number or bigint")}var A=e=>e===0||e===BigInt(0),C=(e,t)=>t===1||t===BigInt(1)?e:`${e}s`,G=1e-7,V=BigInt(24)*BigInt(60)*BigInt(60)*BigInt(1000);function N(e,t){let n=typeof e=="bigint";if(!n&&!Number.isFinite(e))throw new TypeError("Expected a finite number or bigint");t=m({},t);let s=e<0?"-":"";e=e<0?-e:e,t.colonNotation&&(t.compact=false,t.formatSubMilliseconds=false,t.separateMilliseconds=false,t.verbose=false),t.compact&&(t.unitCount=1,t.secondsDecimalDigits=0,t.millisecondsDecimalDigits=0);let c=[],b=(a,u)=>{let f=Math.floor(a*10**u+G);return (Math.round(f)/10**u).toFixed(u)},i=(a,u,f,r)=>{if(!((c.length===0||!t.colonNotation)&&A(a)&&!(t.colonNotation&&f==="m"))){if(r!=null||(r=String(a)),t.colonNotation){let l=r.includes(".")?r.split(".")[0].length:r.length,g=c.length>0?2:1;r="0".repeat(Math.max(0,g-l))+r;}else r+=t.verbose?" "+C(u,a):f;c.push(r);}},o=M(e),d=BigInt(o.days);if(t.hideYearAndDays?i(BigInt(d)*BigInt(24)+BigInt(o.hours),"hour","h"):(t.hideYear?i(d,"day","d"):(i(d/BigInt(365),"year","y"),i(d%BigInt(365),"day","d")),i(Number(o.hours),"hour","h")),i(Number(o.minutes),"minute","m"),!t.hideSeconds)if(t.separateMilliseconds||t.formatSubMilliseconds||!t.colonNotation&&e<1e3){let a=Number(o.seconds),u=Number(o.milliseconds),f=Number(o.microseconds),r=Number(o.nanoseconds);if(i(a,"second","s"),t.formatSubMilliseconds)i(u,"millisecond","ms"),i(f,"microsecond","\xB5s"),i(r,"nanosecond","ns");else {let l=u+f/1e3+r/1e6,g=typeof t.millisecondsDecimalDigits=="number"?t.millisecondsDecimalDigits:0,S=l>=1?Math.round(l):Math.ceil(l),_=g?l.toFixed(g):S;i(Number.parseFloat(_),"millisecond","ms",_);}}else {let a=(n?Number(e%V):e)/1e3%60,u=typeof t.secondsDecimalDigits=="number"?t.secondsDecimalDigits:1,f=b(a,u),r=t.keepDecimalsOnWholeSeconds?f:f.replace(/\.0+$/,"");i(Number.parseFloat(r),"second","s",r);}if(c.length===0)return s+"0"+(t.verbose?" milliseconds":"ms");let h=t.colonNotation?":":" ";return typeof t.unitCount=="number"&&(c=c.slice(0,Math.max(t.unitCount,1))),s+c.join(h)}var j=(e,t,n)=>{let s=y(t,{locale:e.language}),c=new TextEncoder().encode(s);Dart.send_value(n,c);},z=(e,t,n)=>{let s=N(t,{verbose:e.verbose}),c=new TextEncoder().encode(s);Dart.send_value(n,c);},v={init(e="en",t=false){return {language:e,verbose:t}},functions:{make_pretty_bytes:j,make_pretty_ms:z}};export{v as default};
''';

class PrettyNode {
  final runtime.Module _module;

  PrettyNode._(this._module);

  static Future<PrettyNode> create({String? language, bool? verbose}) async {
    final module = runtime.InlinedModule(
      name: 'PrettyNode',
      sourceCode: packageSource,
    );

    await module.register(args: [
      language?.toFFIType,
      verbose?.toFFIType
    ]);
    return PrettyNode._(module);
  }

  void dispose() {
    runtime.GlobeRuntime.instance.dispose();
  }

  
  Future<String> makePrettyBytes(num value) async {
    final completer = Completer<String>();

    _module.callFunction(
      'make_pretty_bytes',
      args: [value.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          
          final result = data.data;
          completer.complete(utf8.decode(result));
          
        }
        return true;
      },
    );

    return completer.future;
  }
  

  Future<String> makePrettyMs(num value) async {
    final completer = Completer<String>();

    _module.callFunction(
      'make_pretty_ms',
      args: [value.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          
          final result = data.data;
          completer.complete(utf8.decode(result));
          
        }
        return true;
      },
    );

    return completer.future;
  }
  
}
