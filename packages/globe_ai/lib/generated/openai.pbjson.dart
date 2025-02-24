//
//  Generated code. Do not modify.
//  source: openai.proto
//
// @dart = 2.12

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_final_fields
// ignore_for_file: unnecessary_import, unnecessary_this, unused_import

import 'dart:convert' as $convert;
import 'dart:core' as $core;
import 'dart:typed_data' as $typed_data;

@$core.Deprecated('Use chatCompletionDescriptor instead')
const ChatCompletion$json = {
  '1': 'ChatCompletion',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {'1': 'object', '3': 2, '4': 1, '5': 9, '10': 'object'},
    {'1': 'created', '3': 3, '4': 1, '5': 13, '10': 'created'},
    {'1': 'model', '3': 4, '4': 1, '5': 9, '10': 'model'},
    {'1': 'choices', '3': 5, '4': 3, '5': 11, '6': '.ChatCompletion.Choices', '10': 'choices'},
    {'1': 'usage', '3': 6, '4': 1, '5': 11, '6': '.ChatCompletion.Usage', '10': 'usage'},
    {'1': 'service_tier', '3': 7, '4': 1, '5': 9, '10': 'serviceTier'},
    {'1': 'system_fingerprint', '3': 8, '4': 1, '5': 9, '10': 'systemFingerprint'},
  ],
  '3': [ChatCompletion_Message$json, ChatCompletion_Choices$json, ChatCompletion_Prompt_tokens_details$json, ChatCompletion_Completion_tokens_details$json, ChatCompletion_Usage$json],
};

@$core.Deprecated('Use chatCompletionDescriptor instead')
const ChatCompletion_Message$json = {
  '1': 'Message',
  '2': [
    {'1': 'role', '3': 1, '4': 1, '5': 9, '10': 'role'},
    {'1': 'content', '3': 2, '4': 1, '5': 9, '10': 'content'},
    {'1': 'refusal', '3': 3, '4': 1, '5': 11, '6': '.google.protobuf.Any', '10': 'refusal'},
  ],
};

@$core.Deprecated('Use chatCompletionDescriptor instead')
const ChatCompletion_Choices$json = {
  '1': 'Choices',
  '2': [
    {'1': 'index', '3': 1, '4': 1, '5': 13, '10': 'index'},
    {'1': 'message', '3': 2, '4': 1, '5': 11, '6': '.ChatCompletion.Message', '10': 'message'},
    {'1': 'logprobs', '3': 3, '4': 1, '5': 11, '6': '.google.protobuf.Any', '10': 'logprobs'},
    {'1': 'finish_reason', '3': 4, '4': 1, '5': 9, '10': 'finishReason'},
  ],
};

@$core.Deprecated('Use chatCompletionDescriptor instead')
const ChatCompletion_Prompt_tokens_details$json = {
  '1': 'Prompt_tokens_details',
  '2': [
    {'1': 'cached_tokens', '3': 1, '4': 1, '5': 13, '10': 'cachedTokens'},
    {'1': 'audio_tokens', '3': 2, '4': 1, '5': 13, '10': 'audioTokens'},
  ],
};

@$core.Deprecated('Use chatCompletionDescriptor instead')
const ChatCompletion_Completion_tokens_details$json = {
  '1': 'Completion_tokens_details',
  '2': [
    {'1': 'reasoning_tokens', '3': 1, '4': 1, '5': 13, '10': 'reasoningTokens'},
    {'1': 'audio_tokens', '3': 2, '4': 1, '5': 13, '10': 'audioTokens'},
    {'1': 'accepted_prediction_tokens', '3': 3, '4': 1, '5': 13, '10': 'acceptedPredictionTokens'},
    {'1': 'rejected_prediction_tokens', '3': 4, '4': 1, '5': 13, '10': 'rejectedPredictionTokens'},
  ],
};

@$core.Deprecated('Use chatCompletionDescriptor instead')
const ChatCompletion_Usage$json = {
  '1': 'Usage',
  '2': [
    {'1': 'prompt_tokens', '3': 1, '4': 1, '5': 13, '10': 'promptTokens'},
    {'1': 'completion_tokens', '3': 2, '4': 1, '5': 13, '10': 'completionTokens'},
    {'1': 'total_tokens', '3': 3, '4': 1, '5': 13, '10': 'totalTokens'},
    {'1': 'prompt_tokens_details', '3': 4, '4': 1, '5': 11, '6': '.ChatCompletion.Prompt_tokens_details', '10': 'promptTokensDetails'},
    {'1': 'completion_tokens_details', '3': 5, '4': 1, '5': 11, '6': '.ChatCompletion.Completion_tokens_details', '10': 'completionTokensDetails'},
  ],
};

/// Descriptor for `ChatCompletion`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List chatCompletionDescriptor = $convert.base64Decode(
    'Cg5DaGF0Q29tcGxldGlvbhIOCgJpZBgBIAEoCVICaWQSFgoGb2JqZWN0GAIgASgJUgZvYmplY3'
    'QSGAoHY3JlYXRlZBgDIAEoDVIHY3JlYXRlZBIUCgVtb2RlbBgEIAEoCVIFbW9kZWwSMQoHY2hv'
    'aWNlcxgFIAMoCzIXLkNoYXRDb21wbGV0aW9uLkNob2ljZXNSB2Nob2ljZXMSKwoFdXNhZ2UYBi'
    'ABKAsyFS5DaGF0Q29tcGxldGlvbi5Vc2FnZVIFdXNhZ2USIQoMc2VydmljZV90aWVyGAcgASgJ'
    'UgtzZXJ2aWNlVGllchItChJzeXN0ZW1fZmluZ2VycHJpbnQYCCABKAlSEXN5c3RlbUZpbmdlcn'
    'ByaW50GmcKB01lc3NhZ2USEgoEcm9sZRgBIAEoCVIEcm9sZRIYCgdjb250ZW50GAIgASgJUgdj'
    'b250ZW50Ei4KB3JlZnVzYWwYAyABKAsyFC5nb29nbGUucHJvdG9idWYuQW55UgdyZWZ1c2FsGq'
    'kBCgdDaG9pY2VzEhQKBWluZGV4GAEgASgNUgVpbmRleBIxCgdtZXNzYWdlGAIgASgLMhcuQ2hh'
    'dENvbXBsZXRpb24uTWVzc2FnZVIHbWVzc2FnZRIwCghsb2dwcm9icxgDIAEoCzIULmdvb2dsZS'
    '5wcm90b2J1Zi5BbnlSCGxvZ3Byb2JzEiMKDWZpbmlzaF9yZWFzb24YBCABKAlSDGZpbmlzaFJl'
    'YXNvbhpfChVQcm9tcHRfdG9rZW5zX2RldGFpbHMSIwoNY2FjaGVkX3Rva2VucxgBIAEoDVIMY2'
    'FjaGVkVG9rZW5zEiEKDGF1ZGlvX3Rva2VucxgCIAEoDVILYXVkaW9Ub2tlbnMa5QEKGUNvbXBs'
    'ZXRpb25fdG9rZW5zX2RldGFpbHMSKQoQcmVhc29uaW5nX3Rva2VucxgBIAEoDVIPcmVhc29uaW'
    '5nVG9rZW5zEiEKDGF1ZGlvX3Rva2VucxgCIAEoDVILYXVkaW9Ub2tlbnMSPAoaYWNjZXB0ZWRf'
    'cHJlZGljdGlvbl90b2tlbnMYAyABKA1SGGFjY2VwdGVkUHJlZGljdGlvblRva2VucxI8ChpyZW'
    'plY3RlZF9wcmVkaWN0aW9uX3Rva2VucxgEIAEoDVIYcmVqZWN0ZWRQcmVkaWN0aW9uVG9rZW5z'
    'Gr4CCgVVc2FnZRIjCg1wcm9tcHRfdG9rZW5zGAEgASgNUgxwcm9tcHRUb2tlbnMSKwoRY29tcG'
    'xldGlvbl90b2tlbnMYAiABKA1SEGNvbXBsZXRpb25Ub2tlbnMSIQoMdG90YWxfdG9rZW5zGAMg'
    'ASgNUgt0b3RhbFRva2VucxJZChVwcm9tcHRfdG9rZW5zX2RldGFpbHMYBCABKAsyJS5DaGF0Q2'
    '9tcGxldGlvbi5Qcm9tcHRfdG9rZW5zX2RldGFpbHNSE3Byb21wdFRva2Vuc0RldGFpbHMSZQoZ'
    'Y29tcGxldGlvbl90b2tlbnNfZGV0YWlscxgFIAEoCzIpLkNoYXRDb21wbGV0aW9uLkNvbXBsZX'
    'Rpb25fdG9rZW5zX2RldGFpbHNSF2NvbXBsZXRpb25Ub2tlbnNEZXRhaWxz');

