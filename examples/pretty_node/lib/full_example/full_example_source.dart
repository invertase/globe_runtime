import 'dart:async';
import 'dart:convert';
import 'package:globe_runtime/globe_runtime.dart';

const packageVersion = '1.0.0';
const packageSource = r'''
const e=[`B`,`kB`,`MB`,`GB`,`TB`,`PB`,`EB`,`ZB`,`YB`],t=[`B`,`KiB`,`MiB`,`GiB`,`TiB`,`PiB`,`EiB`,`ZiB`,`YiB`],n=[`b`,`kbit`,`Mbit`,`Gbit`,`Tbit`,`Pbit`,`Ebit`,`Zbit`,`Ybit`],r=[`b`,`kibit`,`Mibit`,`Gibit`,`Tibit`,`Pibit`,`Eibit`,`Zibit`,`Yibit`],i=(e,t,n)=>{let r=e;return typeof t==`string`||Array.isArray(t)?r=e.toLocaleString(t,n):(t===!0||n!==void 0)&&(r=e.toLocaleString(void 0,n)),r},a=e=>{if(typeof e==`number`)return Math.log10(e);let t=e.toString(10);return t.length+Math.log10(`0.${t.slice(0,15)}`)},o=e=>typeof e==`number`?Math.log(e):a(e)*Math.log(10),s=(e,t)=>{if(typeof e==`number`)return e/t;let n=e/BigInt(t),r=e%BigInt(t);return Number(n)+Number(r)/t},c=(e,t)=>{if(t===void 0)return e;if(typeof t!=`number`||!Number.isSafeInteger(t)||t<0)throw TypeError(`Expected fixedWidth to be a non-negative integer, got ${typeof t}: ${t}`);return t===0?e:e.length<t?e.padStart(t,` `):e},l=e=>{let{minimumFractionDigits:t,maximumFractionDigits:n}=e;if(!(t===void 0&&n===void 0))return{...t!==void 0&&{minimumFractionDigits:t},...n!==void 0&&{maximumFractionDigits:n},roundingMode:`trunc`}};function u(u,d){if(typeof u!=`bigint`&&!Number.isFinite(u))throw TypeError(`Expected a finite number, got ${typeof u}: ${u}`);d={bits:!1,binary:!1,space:!0,nonBreakingSpace:!1,...d};let f=d.bits?d.binary?r:n:d.binary?t:e,p=d.space?d.nonBreakingSpace?`\xA0`:` `:``,m=typeof u==`number`?u===0:u===0n;if(d.signed&&m)return c(` 0${p}${f[0]}`,d.fixedWidth);let h=u<0,g=h?`-`:d.signed?`+`:``;h&&(u=-u);let _=l(d),v;if(u<1)v=g+i(u,d.locale,_)+p+f[0];else{let e=Math.min(Math.floor(d.binary?o(u)/Math.log(1024):a(u)/3),f.length-1);if(u=s(u,(d.binary?1024:1e3)**e),!_){let e=Math.max(3,Math.floor(u).toString().length);u=u.toPrecision(e)}let t=i(Number(u),d.locale,_),n=f[e];v=g+t+p+n}return c(v,d.fixedWidth)}const d=e=>Number.isFinite(e)?e:0;function f(e){return{days:Math.trunc(e/864e5),hours:Math.trunc(e/36e5%24),minutes:Math.trunc(e/6e4%60),seconds:Math.trunc(e/1e3%60),milliseconds:Math.trunc(e%1e3),microseconds:Math.trunc(d(e*1e3)%1e3),nanoseconds:Math.trunc(d(e*1e6)%1e3)}}function p(e){return{days:e/86400000n,hours:e/3600000n%24n,minutes:e/60000n%60n,seconds:e/1000n%60n,milliseconds:e%1000n,microseconds:0n,nanoseconds:0n}}function m(e){switch(typeof e){case`number`:if(Number.isFinite(e))return f(e);break;case`bigint`:return p(e)}throw TypeError(`Expected a finite number or bigint`)}const h=e=>e===0||e===0n,g=(e,t)=>t===1||t===1n?e:`${e}s`,_=24n*60n*60n*1000n;function v(e,t){let n=typeof e==`bigint`;if(!n&&!Number.isFinite(e))throw TypeError(`Expected a finite number or bigint`);t={...t};let r=e<0?`-`:``;e=e<0?-e:e,t.colonNotation&&(t.compact=!1,t.formatSubMilliseconds=!1,t.separateMilliseconds=!1,t.verbose=!1),t.compact&&(t.unitCount=1,t.secondsDecimalDigits=0,t.millisecondsDecimalDigits=0);let i=[],a=(e,t)=>{let n=Math.floor(e*10**t+1e-7);return(Math.round(n)/10**t).toFixed(t)},o=(e,n,r,a)=>{if(!((i.length===0||!t.colonNotation)&&h(e)&&!(t.colonNotation&&r===`m`))){if(a??=String(e),t.colonNotation){let e=a.includes(`.`)?a.split(`.`)[0].length:a.length,t=i.length>0?2:1;a=`0`.repeat(Math.max(0,t-e))+a}else a+=t.verbose?` `+g(n,e):r;i.push(a)}},s=m(e),c=BigInt(s.days);if(t.hideYearAndDays?o(BigInt(c)*24n+BigInt(s.hours),`hour`,`h`):(t.hideYear?o(c,`day`,`d`):(o(c/365n,`year`,`y`),o(c%365n,`day`,`d`)),o(Number(s.hours),`hour`,`h`)),o(Number(s.minutes),`minute`,`m`),!t.hideSeconds)if(t.separateMilliseconds||t.formatSubMilliseconds||!t.colonNotation&&e<1e3&&!t.subSecondsAsDecimals){let e=Number(s.seconds),n=Number(s.milliseconds),r=Number(s.microseconds),i=Number(s.nanoseconds);if(o(e,`second`,`s`),t.formatSubMilliseconds)o(n,`millisecond`,`ms`),o(r,`microsecond`,`µs`),o(i,`nanosecond`,`ns`);else{let e=n+r/1e3+i/1e6,a=typeof t.millisecondsDecimalDigits==`number`?t.millisecondsDecimalDigits:0,s=a?e.toFixed(a):e>=1?Math.round(e):Math.ceil(e);o(Number.parseFloat(s),`millisecond`,`ms`,s)}}else{let r=a((n?Number(e%_):e)/1e3%60,typeof t.secondsDecimalDigits==`number`?t.secondsDecimalDigits:1),i=t.keepDecimalsOnWholeSeconds?r:r.replace(/\.0+$/,``);o(Number.parseFloat(i),`second`,`s`,i)}if(i.length===0)return r+`0`+(t.verbose?` milliseconds`:`ms`);let l=t.colonNotation?`:`:` `;return typeof t.unitCount==`number`&&(i=i.slice(0,Math.max(t.unitCount,1))),r+i.join(l)}const y=()=>function(e){return e},b=y,x=y,S=b(),C=b(),w=b();b();const T=b(),E=b(),D=b(),O=b(),k=b(),A=x(),j=x();x();const M=x();x(),x();const N=x(),P=x();x();var F=y()({init(e=`en`,t=!1){return{language:e,verbose:t}},functions:{make_pretty_bytes:S((e,t,n)=>{let r=u(t,{locale:e.language});Dart.send_value(n,new TextEncoder().encode(r))}),make_pretty_ms:S((e,t,n)=>{let r=v(t,{verbose:e.verbose});Dart.send_value(n,new TextEncoder().encode(r))}),calculate_sum:C((e,t,n,r)=>{let i=Math.floor(t+n);Dart.send_value(r,new TextEncoder().encode(i.toString()))}),calculate_average:w((e,t,n)=>{let r=t.reduce((e,t)=>e+t,0)/t.length;Dart.send_value(n,new TextEncoder().encode(r.toString()))}),is_valid:T((e,t,n)=>{let r=t.length>0;Dart.send_value(n,JsonPayload.encode(r))}),generate_bytes:E((e,t,n)=>{let r=new Uint8Array(t);for(let e=0;e<t;e++)r[e]=Math.floor(Math.random()*256);Dart.send_value(n,r)}),get_metadata:D((e,t,n)=>{let r={id:t,language:e.language,timestamp:Date.now(),nested:{key:`value`}},i=JsonPayload.encode(r);i&&Dart.send_value(n,i)}),get_items:O((e,t,n)=>{let r=Array.from({length:t},(e,t)=>({id:t,name:`Item ${t}`})),i=JsonPayload.encode(r);i&&Dart.send_value(n,i)}),get_unique_values:k((e,t,n)=>{let r=[...new Set(t)],i=JsonPayload.encode(r);i&&Dart.send_value(n,i)}),stream_messages:A((e,t,n)=>{for(let r=0;r<t;r++){let t=`Message ${r+1} in ${e.language}`;Dart.stream_value(n,new TextEncoder().encode(t))}Dart.stream_value_end(n)}),stream_integers:j((e,t,n)=>{for(let e=0;e<t;e++)Dart.stream_value(n,new TextEncoder().encode(e.toString()));Dart.stream_value_end(n)}),stream_random_numbers:M((e,t,n)=>{for(let e=0;e<t;e++){let e=Math.random()*1e3;Dart.stream_value(n,new TextEncoder().encode(e.toString()))}Dart.stream_value_end(n)}),stream_updates:N(async(e,t,n)=>{for(let r=0;r<t;r++){let t={index:r,timestamp:Date.now(),language:e.language};await new Promise(e=>setTimeout(e,100));let i=JsonPayload.encode(t);i&&Dart.stream_value(n,i)}Dart.stream_value_end(n)}),stream_batches:P((e,t,n,r)=>{for(let e=0;e<t;e++){let t=Array.from({length:n},(t,r)=>e*n+r),i=JsonPayload.encode(t);i&&Dart.stream_value(r,i)}Dart.stream_value_end(r)})}});export{F as default};
''';

class FullExample {
  final Module _module;

  FullExample._(this._module);

  static Future<FullExample> create({String? language, bool? verbose}) async {
    final module = InlinedModule(
      name: 'FullExample',
      sourceCode: packageSource,
    );

    await module.register(args: [language?.toFFIType, verbose?.toFFIType]);
    return FullExample._(module);
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

  Future<num> calculateSum(num a, num b) async {
    final completer = Completer<num>();

    _module.callFunction(
      'calculate_sum',
      args: [a.toFFIType, b.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final value = data.data.unpack();
          completer.complete(value as num);
        }
        return true;
      },
    );

    return completer.future;
  }

  Future<num> calculateAverage(List<num> values) async {
    final completer = Completer<num>();

    _module.callFunction(
      'calculate_average',
      args: [values.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final value = data.data.unpack();
          completer.complete(value as num);
        }
        return true;
      },
    );

    return completer.future;
  }

  Future<bool> isValid(String value) async {
    final completer = Completer<bool>();

    _module.callFunction(
      'is_valid',
      args: [value.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final value = data.data.unpack();
          completer.complete(value as bool);
        }
        return true;
      },
    );

    return completer.future;
  }

  Future<List<int>> generateBytes(num length) async {
    final completer = Completer<List<int>>();

    _module.callFunction(
      'generate_bytes',
      args: [length.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final value = data.data;
          completer.complete(value);
        }
        return true;
      },
    );

    return completer.future;
  }

  Future<Map<dynamic, dynamic>> getMetadata(String id) async {
    final completer = Completer<Map<dynamic, dynamic>>();

    _module.callFunction(
      'get_metadata',
      args: [id.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final value = data.data.unpack();
          completer.complete(value as Map<dynamic, dynamic>);
        }
        return true;
      },
    );

    return completer.future;
  }

  Future<List<dynamic>> getItems(num count) async {
    final completer = Completer<List<dynamic>>();

    _module.callFunction(
      'get_items',
      args: [count.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final value = data.data.unpack();
          completer.complete(value as List<dynamic>);
        }
        return true;
      },
    );

    return completer.future;
  }

  Future<Set<dynamic>> getUniqueValues(List<num> values) async {
    final completer = Completer<Set<dynamic>>();

    _module.callFunction(
      'get_unique_values',
      args: [values.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          completer.completeError(data.error);
        } else {
          final value = data.data.unpack();
          completer.complete(Set.from(value));
        }
        return true;
      },
    );

    return completer.future;
  }

  Stream<String> streamMessages(num count) {
    final controller = StreamController<String>();

    _module.callFunction(
      'stream_messages',
      args: [count.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          controller.addError(data.error);
          return true;
        }

        if (data.hasData()) {
          final value = data.data;
          controller.add(utf8.decode(value));
        }

        if (data.done) {
          controller.close();
          return true;
        }

        return false; // Keep listening for more data
      },
    );

    return controller.stream;
  }

  Stream<num> streamIntegers(num max) {
    final controller = StreamController<num>();

    _module.callFunction(
      'stream_integers',
      args: [max.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          controller.addError(data.error);
          return true;
        }

        if (data.hasData()) {
          final value = data.data.unpack();
          controller.add(value as num);
        }

        if (data.done) {
          controller.close();
          return true;
        }

        return false; // Keep listening for more data
      },
    );

    return controller.stream;
  }

  Stream<num> streamRandomNumbers(num count) {
    final controller = StreamController<num>();

    _module.callFunction(
      'stream_random_numbers',
      args: [count.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          controller.addError(data.error);
          return true;
        }

        if (data.hasData()) {
          final value = data.data.unpack();
          controller.add(value as num);
        }

        if (data.done) {
          controller.close();
          return true;
        }

        return false; // Keep listening for more data
      },
    );

    return controller.stream;
  }

  Stream<Map<dynamic, dynamic>> streamUpdates(num count) {
    final controller = StreamController<Map<dynamic, dynamic>>();

    _module.callFunction(
      'stream_updates',
      args: [count.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          controller.addError(data.error);
          return true;
        }

        if (data.hasData()) {
          final value = data.data.unpack();
          controller.add(value as Map<dynamic, dynamic>);
        }

        if (data.done) {
          controller.close();
          return true;
        }

        return false; // Keep listening for more data
      },
    );

    return controller.stream;
  }

  Stream<List<dynamic>> streamBatches(num batchCount, num batchSize) {
    final controller = StreamController<List<dynamic>>();

    _module.callFunction(
      'stream_batches',
      args: [batchCount.toFFIType, batchSize.toFFIType],
      onData: (data) {
        if (data.hasError()) {
          controller.addError(data.error);
          return true;
        }

        if (data.hasData()) {
          final value = data.data.unpack();
          controller.add(value as List<dynamic>);
        }

        if (data.done) {
          controller.close();
          return true;
        }

        return false; // Keep listening for more data
      },
    );

    return controller.stream;
  }
}
