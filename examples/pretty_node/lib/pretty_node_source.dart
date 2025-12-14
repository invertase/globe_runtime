// GENERATED FILE — DO NOT MODIFY BY HAND
// This file was generated from @globe/dart_source_generator

import 'dart:async';
import 'dart:convert';
import 'package:globe_runtime/globe_runtime.dart';

const packageVersion = '1.0.0';
const packageSource = r'''
globalThis.Dart??={},globalThis.JsonPayload??={};const e=()=>function(e){return e},t=e,n=e,r=t();t(),t(),t(),t(),t(),t(),t(),t(),n(),n(),n(),n(),n(),n(),n(),n(),n();const i=e(),a=[`B`,`kB`,`MB`,`GB`,`TB`,`PB`,`EB`,`ZB`,`YB`],o=[`B`,`KiB`,`MiB`,`GiB`,`TiB`,`PiB`,`EiB`,`ZiB`,`YiB`],s=[`b`,`kbit`,`Mbit`,`Gbit`,`Tbit`,`Pbit`,`Ebit`,`Zbit`,`Ybit`],c=[`b`,`kibit`,`Mibit`,`Gibit`,`Tibit`,`Pibit`,`Eibit`,`Zibit`,`Yibit`],l=(e,t,n)=>{let r=e;return typeof t==`string`||Array.isArray(t)?r=e.toLocaleString(t,n):(t===!0||n!==void 0)&&(r=e.toLocaleString(void 0,n)),r},u=e=>{if(typeof e==`number`)return Math.log10(e);let t=e.toString(10);return t.length+Math.log10(`0.${t.slice(0,15)}`)},d=e=>typeof e==`number`?Math.log(e):u(e)*Math.log(10),f=(e,t)=>{if(typeof e==`number`)return e/t;let n=e/BigInt(t),r=e%BigInt(t);return Number(n)+Number(r)/t},p=(e,t)=>{if(t===void 0)return e;if(typeof t!=`number`||!Number.isSafeInteger(t)||t<0)throw TypeError(`Expected fixedWidth to be a non-negative integer, got ${typeof t}: ${t}`);return t===0?e:e.length<t?e.padStart(t,` `):e},m=e=>{let{minimumFractionDigits:t,maximumFractionDigits:n}=e;if(!(t===void 0&&n===void 0))return{...t!==void 0&&{minimumFractionDigits:t},...n!==void 0&&{maximumFractionDigits:n},roundingMode:`trunc`}};function h(e,t){if(typeof e!=`bigint`&&!Number.isFinite(e))throw TypeError(`Expected a finite number, got ${typeof e}: ${e}`);t={bits:!1,binary:!1,space:!0,nonBreakingSpace:!1,...t};let n=t.bits?t.binary?c:s:t.binary?o:a,r=t.space?t.nonBreakingSpace?`\xA0`:` `:``,i=typeof e==`number`?e===0:e===0n;if(t.signed&&i)return p(` 0${r}${n[0]}`,t.fixedWidth);let h=e<0,g=h?`-`:t.signed?`+`:``;h&&(e=-e);let _=m(t),v;if(e<1)v=g+l(e,t.locale,_)+r+n[0];else{let i=Math.min(Math.floor(t.binary?d(e)/Math.log(1024):u(e)/3),n.length-1);if(e=f(e,(t.binary?1024:1e3)**i),!_){let t=Math.max(3,Math.floor(e).toString().length);e=e.toPrecision(t)}let a=l(Number(e),t.locale,_),o=n[i];v=g+a+r+o}return p(v,t.fixedWidth)}const g=e=>Number.isFinite(e)?e:0;function _(e){return{days:Math.trunc(e/864e5),hours:Math.trunc(e/36e5%24),minutes:Math.trunc(e/6e4%60),seconds:Math.trunc(e/1e3%60),milliseconds:Math.trunc(e%1e3),microseconds:Math.trunc(g(e*1e3)%1e3),nanoseconds:Math.trunc(g(e*1e6)%1e3)}}function v(e){return{days:e/86400000n,hours:e/3600000n%24n,minutes:e/60000n%60n,seconds:e/1000n%60n,milliseconds:e%1000n,microseconds:0n,nanoseconds:0n}}function y(e){switch(typeof e){case`number`:if(Number.isFinite(e))return _(e);break;case`bigint`:return v(e)}throw TypeError(`Expected a finite number or bigint`)}const b=e=>e===0||e===0n,x=(e,t)=>t===1||t===1n?e:`${e}s`,S=24n*60n*60n*1000n;function C(e,t){let n=typeof e==`bigint`;if(!n&&!Number.isFinite(e))throw TypeError(`Expected a finite number or bigint`);t={...t};let r=e<0?`-`:``;e=e<0?-e:e,t.colonNotation&&(t.compact=!1,t.formatSubMilliseconds=!1,t.separateMilliseconds=!1,t.verbose=!1),t.compact&&(t.unitCount=1,t.secondsDecimalDigits=0,t.millisecondsDecimalDigits=0);let i=[],a=(e,t)=>{let n=Math.floor(e*10**t+1e-7);return(Math.round(n)/10**t).toFixed(t)},o=(e,n,r,a)=>{if(!((i.length===0||!t.colonNotation)&&b(e)&&!(t.colonNotation&&r===`m`))){if(a??=String(e),t.colonNotation){let e=a.includes(`.`)?a.split(`.`)[0].length:a.length,t=i.length>0?2:1;a=`0`.repeat(Math.max(0,t-e))+a}else a+=t.verbose?` `+x(n,e):r;i.push(a)}},s=y(e),c=BigInt(s.days);if(t.hideYearAndDays?o(BigInt(c)*24n+BigInt(s.hours),`hour`,`h`):(t.hideYear?o(c,`day`,`d`):(o(c/365n,`year`,`y`),o(c%365n,`day`,`d`)),o(Number(s.hours),`hour`,`h`)),o(Number(s.minutes),`minute`,`m`),!t.hideSeconds)if(t.separateMilliseconds||t.formatSubMilliseconds||!t.colonNotation&&e<1e3&&!t.subSecondsAsDecimals){let e=Number(s.seconds),n=Number(s.milliseconds),r=Number(s.microseconds),i=Number(s.nanoseconds);if(o(e,`second`,`s`),t.formatSubMilliseconds)o(n,`millisecond`,`ms`),o(r,`microsecond`,`µs`),o(i,`nanosecond`,`ns`);else{let e=n+r/1e3+i/1e6,a=typeof t.millisecondsDecimalDigits==`number`?t.millisecondsDecimalDigits:0,s=a?e.toFixed(a):e>=1?Math.round(e):Math.ceil(e);o(Number.parseFloat(s),`millisecond`,`ms`,s)}}else{let r=a((n?Number(e%S):e)/1e3%60,typeof t.secondsDecimalDigits==`number`?t.secondsDecimalDigits:1),i=t.keepDecimalsOnWholeSeconds?r:r.replace(/\.0+$/,``);o(Number.parseFloat(i),`second`,`s`,i)}if(i.length===0)return r+`0`+(t.verbose?` milliseconds`:`ms`);let l=t.colonNotation?`:`:` `;return typeof t.unitCount==`number`&&(i=i.slice(0,Math.max(t.unitCount,1))),r+i.join(l)}var w=i({init(e=`en`,t=!1){return{language:e,verbose:t}},functions:{make_pretty_bytes:r((e,t,n)=>{let r=h(t,{locale:e.language});Dart.send_value(n,new TextEncoder().encode(r))}),make_pretty_ms:r((e,t,n)=>{let r=C(t,{verbose:e.verbose});Dart.send_value(n,new TextEncoder().encode(r))})}});export{w as default};
''';

class PrettyNode {
  final Module _module;

  PrettyNode._(this._module);

  static Future<PrettyNode> create({String? language, bool? verbose}) async {
    final module = InlinedModule(
      name: 'PrettyNode',
      sourceCode: packageSource,
    );

    await module.register(args: [language?.toFFIType, verbose?.toFFIType]);
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
          final value = data.data;
          completer.complete(utf8.decode(value));
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
          final value = data.data;
          completer.complete(utf8.decode(value));
        }
        return true;
      },
    );

    return completer.future;
  }
}
