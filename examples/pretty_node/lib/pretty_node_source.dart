
import 'dart:async';
import 'dart:convert';
import 'package:globe_runtime/globe_runtime.dart';

const packageVersion = '1.0.0';
const packageSource = r'''
const e=[`B`,`kB`,`MB`,`GB`,`TB`,`PB`,`EB`,`ZB`,`YB`],t=[`B`,`KiB`,`MiB`,`GiB`,`TiB`,`PiB`,`EiB`,`ZiB`,`YiB`],n=[`b`,`kbit`,`Mbit`,`Gbit`,`Tbit`,`Pbit`,`Ebit`,`Zbit`,`Ybit`],r=[`b`,`kibit`,`Mibit`,`Gibit`,`Tibit`,`Pibit`,`Eibit`,`Zibit`,`Yibit`],i=(e,t,n)=>{let r=e;return typeof t==`string`||Array.isArray(t)?r=e.toLocaleString(t,n):(t===!0||n!==void 0)&&(r=e.toLocaleString(void 0,n)),r},a=e=>{if(typeof e==`number`)return Math.log10(e);let t=e.toString(10);return t.length+Math.log10(`0.`+t.slice(0,15))},o=e=>typeof e==`number`?Math.log(e):a(e)*Math.log(10),s=(e,t)=>{if(typeof e==`number`)return e/t;let n=e/BigInt(t),r=e%BigInt(t);return Number(n)+Number(r)/t};function c(c,l){if(typeof c!=`bigint`&&!Number.isFinite(c))throw TypeError(`Expected a finite number, got ${typeof c}: ${c}`);l={bits:!1,binary:!1,space:!0,...l};let u=l.bits?l.binary?r:n:l.binary?t:e,d=l.space?` `:``;if(l.signed&&(typeof c==`number`?c===0:c===0n))return` 0${d}${u[0]}`;let f=c<0,p=f?`-`:l.signed?`+`:``;f&&(c=-c);let m;if(l.minimumFractionDigits!==void 0&&(m={minimumFractionDigits:l.minimumFractionDigits}),l.maximumFractionDigits!==void 0&&(m={maximumFractionDigits:l.maximumFractionDigits,...m}),c<1)return p+i(c,l.locale,m)+d+u[0];let h=Math.min(Math.floor(l.binary?o(c)/Math.log(1024):a(c)/3),u.length-1);c=s(c,(l.binary?1024:1e3)**h),m||(c=c.toPrecision(3));let g=i(Number(c),l.locale,m),_=u[h];return p+g+d+_}const l=e=>Number.isFinite(e)?e:0;function u(e){return{days:Math.trunc(e/864e5),hours:Math.trunc(e/36e5%24),minutes:Math.trunc(e/6e4%60),seconds:Math.trunc(e/1e3%60),milliseconds:Math.trunc(e%1e3),microseconds:Math.trunc(l(e*1e3)%1e3),nanoseconds:Math.trunc(l(e*1e6)%1e3)}}function d(e){return{days:e/86400000n,hours:e/3600000n%24n,minutes:e/60000n%60n,seconds:e/1000n%60n,milliseconds:e%1000n,microseconds:0n,nanoseconds:0n}}function f(e){switch(typeof e){case`number`:if(Number.isFinite(e))return u(e);break;case`bigint`:return d(e)}throw TypeError(`Expected a finite number or bigint`)}const p=e=>e===0||e===0n,m=(e,t)=>t===1||t===1n?e:`${e}s`,h=24n*60n*60n*1000n;function g(e,t){let n=typeof e==`bigint`;if(!n&&!Number.isFinite(e))throw TypeError(`Expected a finite number or bigint`);t={...t};let r=e<0?`-`:``;e=e<0?-e:e,t.colonNotation&&(t.compact=!1,t.formatSubMilliseconds=!1,t.separateMilliseconds=!1,t.verbose=!1),t.compact&&(t.unitCount=1,t.secondsDecimalDigits=0,t.millisecondsDecimalDigits=0);let i=[],a=(e,t)=>{let n=Math.floor(e*10**t+1e-7);return(Math.round(n)/10**t).toFixed(t)},o=(e,n,r,a)=>{if(!((i.length===0||!t.colonNotation)&&p(e)&&!(t.colonNotation&&r===`m`))){if(a??=String(e),t.colonNotation){let e=a.includes(`.`)?a.split(`.`)[0].length:a.length,t=i.length>0?2:1;a=`0`.repeat(Math.max(0,t-e))+a}else a+=t.verbose?` `+m(n,e):r;i.push(a)}},s=f(e),c=BigInt(s.days);if(t.hideYearAndDays?o(BigInt(c)*24n+BigInt(s.hours),`hour`,`h`):(t.hideYear?o(c,`day`,`d`):(o(c/365n,`year`,`y`),o(c%365n,`day`,`d`)),o(Number(s.hours),`hour`,`h`)),o(Number(s.minutes),`minute`,`m`),!t.hideSeconds)if(t.separateMilliseconds||t.formatSubMilliseconds||!t.colonNotation&&e<1e3){let e=Number(s.seconds),n=Number(s.milliseconds),r=Number(s.microseconds),i=Number(s.nanoseconds);if(o(e,`second`,`s`),t.formatSubMilliseconds)o(n,`millisecond`,`ms`),o(r,`microsecond`,`µs`),o(i,`nanosecond`,`ns`);else{let e=n+r/1e3+i/1e6,a=typeof t.millisecondsDecimalDigits==`number`?t.millisecondsDecimalDigits:0,s=a?e.toFixed(a):e>=1?Math.round(e):Math.ceil(e);o(Number.parseFloat(s),`millisecond`,`ms`,s)}}else{let r=a((n?Number(e%h):e)/1e3%60,typeof t.secondsDecimalDigits==`number`?t.secondsDecimalDigits:1),i=t.keepDecimalsOnWholeSeconds?r:r.replace(/\.0+$/,``);o(Number.parseFloat(i),`second`,`s`,i)}if(i.length===0)return r+`0`+(t.verbose?` milliseconds`:`ms`);let l=t.colonNotation?`:`:` `;return typeof t.unitCount==`number`&&(i=i.slice(0,Math.max(t.unitCount,1))),r+i.join(l)}function _(e){return e}var v=_({init(e=`en`,t=!1){return{language:e,verbose:t}},functions:{make_pretty_bytes:(e,t,n)=>{let r=c(t,{locale:e.language}),i=new TextEncoder().encode(r);Dart.send_value(n,i)},make_pretty_ms:(e,t,n)=>{let r=g(t,{verbose:e.verbose}),i=new TextEncoder().encode(r);Dart.send_value(n,i)}}});export{v as default};
''';

class PrettyNode {
  final Module _module;

  PrettyNode._(this._module);

  static Future<PrettyNode> create({String? language, bool? verbose}) async {
    final module = InlinedModule(
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
    GlobeRuntime.instance.dispose();
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
