type MAXIMUM_ALLOWED_BOUNDARY = 500;

type ComputeRange<N extends number, Result extends Array<unknown> = []> = Result['length'] extends N
	? Result
	: ComputeRange<N, [...Result, Result['length']]>;

export type Integer = ComputeRange<MAXIMUM_ALLOWED_BOUNDARY>[number];
