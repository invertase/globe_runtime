// ignore_for_file: constant_identifier_names

part of 'runtime.dart';

/// Protocol for all FFI-compatible types.
abstract class FFIConvertible {
  /// Converts a Dart object into an FFI-compatible format.
  Pointer<Void> toFFI();

  /// Returns the corresponding type identifier (for Rust).
  FFITypeId get typeId;
}

enum FFITypeId {
  none(0),
  string(1),
  integer(2),
  double(3),
  bool(4),
  bytes(5);

  final int value;
  const FFITypeId(this.value);
}

extension FFITypeExtension on Object {
  FFIConvertible get toFFIType => switch (this) {
        String() => FFIString(this as String),
        int() => FFIInt(this as int),
        double() => FFIDouble(this as double),
        bool() => FFIBool(this as bool),
        List<int>() => FFIBytes(this as List<int>),
        _ =>
          throw UnimplementedError('FFIConvertible not found for $runtimeType'),
      };
}

class FFIString implements FFIConvertible {
  final String value;
  FFIString(this.value);

  @override
  Pointer<Void> toFFI() => value.toNativeUtf8().cast();

  @override
  FFITypeId get typeId => FFITypeId.string;
}

class FFIInt implements FFIConvertible {
  final int value;
  FFIInt(this.value);

  @override
  Pointer<Void> toFFI() => Pointer.fromAddress(value);

  @override
  FFITypeId get typeId => FFITypeId.integer;
}

class FFIDouble implements FFIConvertible {
  final double value;
  FFIDouble(this.value);

  @override
  Pointer<Void> toFFI() {
    final ptr = calloc<Double>();
    ptr.value = value;
    return ptr.cast();
  }

  @override
  FFITypeId get typeId => FFITypeId.double;
}

class FFIBool extends FFIInt {
  // ignore: unused_field
  final bool _value;

  FFIBool(this._value) : super(_value ? 1 : 0);

  @override
  FFITypeId get typeId => FFITypeId.bool;
}

class FFIBytes implements FFIConvertible {
  final List<int> value;
  FFIBytes(this.value);

  @override
  Pointer<Void> toFFI() {
    final ptr = calloc<Uint8>(value.length);
    final byteList = ptr.asTypedList(value.length);
    byteList.setAll(0, value);
    return ptr.cast();
  }

  @override
  FFITypeId get typeId => FFITypeId.bytes;
}

typedef GetTypeArguments = ({
  Pointer<Pointer<Void>> argPointers,
  Pointer<Int32> typeIds,
  Pointer<IntPtr> sizes,
  int length,
});

extension GetTypeArgumentsExtension on GetTypeArguments {
  void free() {
    calloc.free(argPointers);
    calloc.free(typeIds);
    calloc.free(sizes);
  }
}

GetTypeArguments getTypeArguments(List<FFIConvertible?> args) {
  final Pointer<Pointer<Void>> argPointers = calloc(args.length);
  final Pointer<Int32> typeIds = calloc(args.length);
  final Pointer<IntPtr> sizes = calloc(args.length);

  for (int i = 0; i < args.length; i++) {
    final objectAtIndex = args[i];

    argPointers[i] = objectAtIndex == null ? nullptr : objectAtIndex.toFFI();
    typeIds[i] = objectAtIndex == null
        ? FFITypeId.none.value
        : objectAtIndex.typeId.value;

    if (objectAtIndex is FFIBytes) {
      sizes[i] = objectAtIndex.value.length;
    } else {
      sizes[i] = 0;
    }
  }

  return (
    argPointers: argPointers,
    typeIds: typeIds,
    sizes: sizes,
    length: args.length,
  );
}
