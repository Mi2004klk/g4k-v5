type AuthToken = string | undefined;
interface Auth {
    /**
     * Which part of the request do we use to send the auth?
     *
     * @default 'header'
     */
    in?: 'header' | 'query' | 'cookie';
    /**
     * A unique identifier for the security scheme.
     *
     * Defined only when there are multiple security schemes whose `Auth`
     * shape would otherwise be identical.
     */
    key?: string;
    /**
     * Header or query parameter name.
     *
     * @default 'Authorization'
     */
    name?: string;
    scheme?: 'basic' | 'bearer';
    type: 'apiKey' | 'http';
}

interface SerializerOptions<T> {
    /**
     * @default true
     */
    explode: boolean;
    style: T;
}
type ArrayStyle = 'form' | 'spaceDelimited' | 'pipeDelimited';
type ObjectStyle = 'form' | 'deepObject';

type QuerySerializer = (query: Record<string, unknown>) => string;
type BodySerializer = (body: unknown) => unknown;
type QuerySerializerOptionsObject = {
    allowReserved?: boolean;
    array?: Partial<SerializerOptions<ArrayStyle>>;
    object?: Partial<SerializerOptions<ObjectStyle>>;
};
type QuerySerializerOptions = QuerySerializerOptionsObject & {
    /**
     * Per-parameter serialization overrides. When provided, these settings
     * override the global array/object settings for specific parameter names.
     */
    parameters?: Record<string, QuerySerializerOptionsObject>;
};

type HttpMethod = 'connect' | 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'trace';
type Client$1<RequestFn = never, Config = unknown, MethodFn = never, BuildUrlFn = never, SseFn = never> = {
    /**
     * Returns the final request URL.
     */
    buildUrl: BuildUrlFn;
    getConfig: () => Config;
    request: RequestFn;
    setConfig: (config: Config) => Config;
} & {
    [K in HttpMethod]: MethodFn;
} & ([SseFn] extends [never] ? {
    sse?: never;
} : {
    sse: {
        [K in HttpMethod]: SseFn;
    };
});
interface Config$1 {
    /**
     * Auth token or a function returning auth token. The resolved value will be
     * added to the request payload as defined by its `security` array.
     */
    auth?: ((auth: Auth) => Promise<AuthToken> | AuthToken) | AuthToken;
    /**
     * A function for serializing request body parameter. By default,
     * {@link JSON.stringify()} will be used.
     */
    bodySerializer?: BodySerializer | null;
    /**
     * An object containing any HTTP headers that you want to pre-populate your
     * `Headers` object with.
     *
     * {@link https://developer.mozilla.org/docs/Web/API/Headers/Headers#init See more}
     */
    headers?: RequestInit['headers'] | Record<string, string | number | boolean | (string | number | boolean)[] | null | undefined | unknown>;
    /**
     * The request method.
     *
     * {@link https://developer.mozilla.org/docs/Web/API/fetch#method See more}
     */
    method?: Uppercase<HttpMethod>;
    /**
     * A function for serializing request query parameters. By default, arrays
     * will be exploded in form style, objects will be exploded in deepObject
     * style, and reserved characters are percent-encoded.
     *
     * This method will have no effect if the native `paramsSerializer()` Axios
     * API function is used.
     *
     * {@link https://swagger.io/docs/specification/serialization/#query View examples}
     */
    querySerializer?: QuerySerializer | QuerySerializerOptions;
    /**
     * A function validating request data. This is useful if you want to ensure
     * the request conforms to the desired shape, so it can be safely sent to
     * the server.
     */
    requestValidator?: (data: unknown) => Promise<unknown>;
    /**
     * A function transforming response data before it's returned. This is useful
     * for post-processing data, e.g., converting ISO strings into Date objects.
     */
    responseTransformer?: (data: unknown) => Promise<unknown>;
    /**
     * A function validating response data. This is useful if you want to ensure
     * the response conforms to the desired shape, so it can be safely passed to
     * the transformers and returned to the user.
     */
    responseValidator?: (data: unknown) => Promise<unknown>;
}
/**
 * Arbitrary metadata passed through the `meta` request option.
 */
interface ClientMeta {
}

type ServerSentEventsOptions<TData = unknown> = Omit<RequestInit, 'method'> & Pick<Config$1, 'method' | 'responseTransformer' | 'responseValidator'> & {
    /**
     * Fetch API implementation. You can use this option to provide a custom
     * fetch instance.
     *
     * @default globalThis.fetch
     */
    fetch?: typeof fetch;
    /**
     * Implementing clients can call request interceptors inside this hook.
     */
    onRequest?: (url: string, init: RequestInit) => Promise<Request>;
    /**
     * Callback invoked when a network or parsing error occurs during streaming.
     *
     * This option applies only if the endpoint returns a stream of events.
     *
     * @param error The error that occurred.
     */
    onSseError?: (error: unknown) => void;
    /**
     * Callback invoked when an event is streamed from the server.
     *
     * This option applies only if the endpoint returns a stream of events.
     *
     * @param event Event streamed from the server.
     * @returns Nothing (void).
     */
    onSseEvent?: (event: StreamEvent<TData>) => void;
    serializedBody?: RequestInit['body'];
    /**
     * Default retry delay in milliseconds.
     *
     * This option applies only if the endpoint returns a stream of events.
     *
     * @default 3000
     */
    sseDefaultRetryDelay?: number;
    /**
     * Maximum number of retry attempts before giving up.
     */
    sseMaxRetryAttempts?: number;
    /**
     * Maximum retry delay in milliseconds.
     *
     * Applies only when exponential backoff is used.
     *
     * This option applies only if the endpoint returns a stream of events.
     *
     * @default 30000
     */
    sseMaxRetryDelay?: number;
    /**
     * Optional sleep function for retry backoff.
     *
     * Defaults to using `setTimeout`.
     */
    sseSleepFn?: (ms: number) => Promise<void>;
    url: string;
};
interface StreamEvent<TData = unknown> {
    data: TData;
    event?: string;
    id?: string;
    retry?: number;
}
type ServerSentEventsResult<TData = unknown, TReturn = void, TNext = unknown> = {
    stream: AsyncGenerator<TData extends Record<string, unknown> ? TData[keyof TData] : TData, TReturn, TNext>;
};

type ErrInterceptor<Err, Res, Req, Options> = (error: Err, 
/** response may be undefined due to a network error where no response object is produced */
response: Res | undefined, 
/** request may be undefined, because error may be from building the request object itself */
request: Req | undefined, options: Options) => Err | Promise<Err>;
type ReqInterceptor<Req, Options> = (request: Req, options: Options) => Req | Promise<Req>;
type ResInterceptor<Res, Req, Options> = (response: Res, request: Req, options: Options) => Res | Promise<Res>;
declare class Interceptors<Interceptor> {
    fns: Array<Interceptor | null>;
    clear(): void;
    eject(id: number | Interceptor): void;
    exists(id: number | Interceptor): boolean;
    getInterceptorIndex(id: number | Interceptor): number;
    update(id: number | Interceptor, fn: Interceptor): number | Interceptor | false;
    use(fn: Interceptor): number;
}
interface Middleware<Req, Res, Err, Options> {
    error: Interceptors<ErrInterceptor<Err, Res, Req, Options>>;
    request: Interceptors<ReqInterceptor<Req, Options>>;
    response: Interceptors<ResInterceptor<Res, Req, Options>>;
}

type ResponseStyle = 'data' | 'fields';
interface Config<T extends ClientOptions$1 = ClientOptions$1> extends Omit<RequestInit, 'body' | 'headers' | 'method'>, Config$1 {
    /**
     * Base URL for all requests made by this client.
     */
    baseUrl?: T['baseUrl'];
    /**
     * Fetch API implementation. You can use this option to provide a custom
     * fetch instance.
     *
     * @default globalThis.fetch
     */
    fetch?: typeof fetch;
    /**
     * Please don't use the Fetch client for Next.js applications. The `next`
     * options won't have any effect.
     *
     * Install {@link https://www.npmjs.com/package/@hey-api/client-next `@hey-api/client-next`} instead.
     */
    next?: never;
    /**
     * Return the response data parsed in a specified format. By default, `auto`
     * will infer the appropriate method from the `Content-Type` response header.
     * You can override this behavior with any of the {@link Body} methods.
     * Select `stream` if you don't want to parse response data at all.
     *
     * @default 'auto'
     */
    parseAs?: 'arrayBuffer' | 'auto' | 'blob' | 'formData' | 'json' | 'stream' | 'text';
    /**
     * Should we return only data or multiple fields (data, error, response, etc.)?
     *
     * @default 'fields'
     */
    responseStyle?: ResponseStyle;
    /**
     * Throw an error instead of returning it in the response?
     *
     * @default false
     */
    throwOnError?: T['throwOnError'];
}
interface RequestOptions<TData = unknown, TResponseStyle extends ResponseStyle = 'fields', ThrowOnError extends boolean = boolean, Url extends string = string> extends Config<{
    responseStyle: TResponseStyle;
    throwOnError: ThrowOnError;
}>, Pick<ServerSentEventsOptions<TData>, 'onRequest' | 'onSseError' | 'onSseEvent' | 'sseDefaultRetryDelay' | 'sseMaxRetryAttempts' | 'sseMaxRetryDelay'> {
    /**
     * Any body that you want to add to your request.
     *
     * {@link https://developer.mozilla.org/docs/Web/API/fetch#body}
     */
    body?: unknown;
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
    /**
     * Security mechanism(s) to use for the request.
     */
    security?: ReadonlyArray<Auth>;
    url: Url;
}
interface ResolvedRequestOptions<TResponseStyle extends ResponseStyle = 'fields', ThrowOnError extends boolean = boolean, Url extends string = string> extends RequestOptions<unknown, TResponseStyle, ThrowOnError, Url> {
    headers: Headers;
    serializedBody?: string;
}
type RequestResult<TData = unknown, TError = unknown, ThrowOnError extends boolean = boolean, TResponseStyle extends ResponseStyle = 'fields'> = ThrowOnError extends true ? Promise<TResponseStyle extends 'data' ? TData extends Record<string, unknown> ? TData[keyof TData] : TData : {
    data: TData extends Record<string, unknown> ? TData[keyof TData] : TData;
    request: Request;
    response: Response;
}> : Promise<TResponseStyle extends 'data' ? (TData extends Record<string, unknown> ? TData[keyof TData] : TData) | undefined : ({
    data: TData extends Record<string, unknown> ? TData[keyof TData] : TData;
    error: undefined;
} | {
    data: undefined;
    error: TError extends Record<string, unknown> ? TError[keyof TError] : TError;
}) & {
    /** request may be undefined, because error may be from building the request object itself */
    request?: Request;
    /** response may be undefined, because error may be from building the request object itself or from a network error */
    response?: Response;
}>;
interface ClientOptions$1 {
    baseUrl?: string;
    responseStyle?: ResponseStyle;
    throwOnError?: boolean;
}
type MethodFn = <TData = unknown, TError = unknown, ThrowOnError extends boolean = false, TResponseStyle extends ResponseStyle = 'fields'>(options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, 'method'>) => RequestResult<TData, TError, ThrowOnError, TResponseStyle>;
type SseFn = <TData = unknown, _TError = unknown, ThrowOnError extends boolean = false, TResponseStyle extends ResponseStyle = 'fields'>(options: Omit<RequestOptions<never, TResponseStyle, ThrowOnError>, 'method'>) => Promise<ServerSentEventsResult<TData>>;
type RequestFn = <TData = unknown, TError = unknown, ThrowOnError extends boolean = false, TResponseStyle extends ResponseStyle = 'fields'>(options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, 'method'> & Pick<Required<RequestOptions<TData, TResponseStyle, ThrowOnError>>, 'method'>) => RequestResult<TData, TError, ThrowOnError, TResponseStyle>;
type BuildUrlFn = <TData extends {
    body?: unknown;
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
    url: string;
}>(options: TData & Options$1<TData>) => string;
type Client = Client$1<RequestFn, Config, MethodFn, BuildUrlFn, SseFn> & {
    interceptors: Middleware<Request, Response, unknown, ResolvedRequestOptions>;
};
interface TDataShape {
    body?: unknown;
    headers?: unknown;
    path?: unknown;
    query?: unknown;
    url: string;
}
type OmitKeys<T, K> = Pick<T, Exclude<keyof T, K>>;
type Options$1<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean, TResponse = unknown, TResponseStyle extends ResponseStyle = 'fields'> = OmitKeys<RequestOptions<TResponse, TResponseStyle, ThrowOnError>, 'body' | 'path' | 'query' | 'url'> & ([TData] extends [never] ? unknown : Omit<TData, 'url'>);

type ClientOptions = {
    baseUrl: 'http://localhost:8000/api' | 'https://api.games4kings.com/api' | (string & {});
};
type User = {
    id?: number;
    name?: string;
    email?: string;
    employee_id?: string;
    avatar_url?: string;
    must_change_password?: boolean;
    status?: string;
    roles?: Array<string>;
};
type AuthResponse = {
    token?: string;
    user?: User;
    active_role?: string | null;
};
type Session = {
    id?: number;
    device_name?: string;
    ip_address?: string;
    last_used_at?: string;
    is_current?: boolean;
};
type Department = {
    id?: number;
    name?: string;
    description?: string | null;
    teams?: Array<Team>;
};
type Team = {
    id?: number;
    department_id?: number;
    name?: string;
    description?: string | null;
};
type Designation = {
    id?: number;
    name?: string;
    description?: string | null;
};
type GetHealthData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/health';
};
type GetHealthResponses = {
    /**
     * OK
     */
    200: {
        status?: string;
    };
};
type GetHealthResponse = GetHealthResponses[keyof GetHealthResponses];
type PostAuthLoginData = {
    body: {
        /**
         * Email or Employee ID
         */
        identifier: string;
        password: string;
        /**
         * Identifier for the device
         */
        device_name?: string;
    };
    path?: never;
    query?: never;
    url: '/auth/login';
};
type PostAuthLoginErrors = {
    /**
     * Unauthorized
     */
    401: unknown;
    /**
     * Account locked
     */
    423: unknown;
};
type PostAuthLoginResponses = {
    /**
     * Successful authentication
     */
    200: AuthResponse;
};
type PostAuthLoginResponse = PostAuthLoginResponses[keyof PostAuthLoginResponses];
type PostAuthRoleSelectData = {
    body: {
        role: string;
    };
    path?: never;
    query?: never;
    url: '/auth/role/select';
};
type PostAuthRoleSelectErrors = {
    /**
     * Role not assigned to user
     */
    403: unknown;
};
type PostAuthRoleSelectResponses = {
    /**
     * Role selected successfully
     */
    200: AuthResponse;
};
type PostAuthRoleSelectResponse = PostAuthRoleSelectResponses[keyof PostAuthRoleSelectResponses];
type PostAuthForgotPasswordData = {
    body: {
        identifier: string;
        channel: 'smtp' | 'admin';
    };
    path?: never;
    query?: never;
    url: '/auth/forgot-password';
};
type PostAuthForgotPasswordResponses = {
    /**
     * Reset request received
     */
    200: unknown;
};
type PostAuthResetPasswordData = {
    body: {
        token: string;
        email: string;
        password: string;
        password_confirmation: string;
    };
    path?: never;
    query?: never;
    url: '/auth/reset-password';
};
type PostAuthResetPasswordResponses = {
    /**
     * Password reset successful
     */
    200: unknown;
};
type PostAuthChangePasswordData = {
    body: {
        current_password: string;
        password: string;
        password_confirmation: string;
    };
    path?: never;
    query?: never;
    url: '/auth/change-password';
};
type PostAuthChangePasswordResponses = {
    /**
     * Password changed successfully
     */
    200: unknown;
};
type GetAuthSessionsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/auth/sessions';
};
type GetAuthSessionsResponses = {
    /**
     * List of sessions
     */
    200: Array<Session>;
};
type GetAuthSessionsResponse = GetAuthSessionsResponses[keyof GetAuthSessionsResponses];
type DeleteAuthSessionsByIdData = {
    body?: never;
    path: {
        id: number;
    };
    query?: never;
    url: '/auth/sessions/{id}';
};
type DeleteAuthSessionsByIdResponses = {
    /**
     * Session revoked
     */
    200: unknown;
};
type PostAuthLogoutData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/auth/logout';
};
type PostAuthLogoutResponses = {
    /**
     * Logged out
     */
    200: unknown;
};
type GetAuthProfileData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/auth/profile';
};
type GetAuthProfileResponses = {
    /**
     * Profile
     */
    200: User;
};
type GetAuthProfileResponse = GetAuthProfileResponses[keyof GetAuthProfileResponses];
type PutAuthProfileData = {
    body: {
        name?: string;
        phone?: string;
        avatar_url?: string;
    };
    path?: never;
    query?: never;
    url: '/auth/profile';
};
type PutAuthProfileResponses = {
    /**
     * Updated Profile
     */
    200: User;
};
type PutAuthProfileResponse = PutAuthProfileResponses[keyof PutAuthProfileResponses];
type GetDirectoryData = {
    body?: never;
    path?: never;
    query?: {
        search?: string;
        department_id?: number;
    };
    url: '/directory';
};
type GetDirectoryResponses = {
    /**
     * Directory list
     */
    200: {
        data?: Array<User>;
    };
};
type GetDirectoryResponse = GetDirectoryResponses[keyof GetDirectoryResponses];
type GetOrgDepartmentsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/org/departments';
};
type GetOrgDepartmentsResponses = {
    /**
     * Departments
     */
    200: Array<Department>;
};
type GetOrgDepartmentsResponse = GetOrgDepartmentsResponses[keyof GetOrgDepartmentsResponses];
type PostOrgDepartmentsData = {
    body: {
        name?: string;
        description?: string;
    };
    path?: never;
    query?: never;
    url: '/org/departments';
};
type PostOrgDepartmentsResponses = {
    /**
     * Created
     */
    201: Department;
};
type PostOrgDepartmentsResponse = PostOrgDepartmentsResponses[keyof PostOrgDepartmentsResponses];
type DeleteOrgDepartmentsByIdData = {
    body?: never;
    path: {
        id: number;
    };
    query?: never;
    url: '/org/departments/{id}';
};
type DeleteOrgDepartmentsByIdResponses = {
    /**
     * Deleted
     */
    204: void;
};
type DeleteOrgDepartmentsByIdResponse = DeleteOrgDepartmentsByIdResponses[keyof DeleteOrgDepartmentsByIdResponses];
type GetOrgDepartmentsByIdData = {
    body?: never;
    path: {
        id: number;
    };
    query?: never;
    url: '/org/departments/{id}';
};
type GetOrgDepartmentsByIdResponses = {
    /**
     * Department
     */
    200: Department;
};
type GetOrgDepartmentsByIdResponse = GetOrgDepartmentsByIdResponses[keyof GetOrgDepartmentsByIdResponses];
type PutOrgDepartmentsByIdData = {
    body: {
        name?: string;
        description?: string;
    };
    path: {
        id: number;
    };
    query?: never;
    url: '/org/departments/{id}';
};
type PutOrgDepartmentsByIdResponses = {
    /**
     * Updated
     */
    200: Department;
};
type PutOrgDepartmentsByIdResponse = PutOrgDepartmentsByIdResponses[keyof PutOrgDepartmentsByIdResponses];
type PostOrgDepartmentsByDepartmentIdTeamsData = {
    body: {
        name?: string;
        description?: string;
    };
    path: {
        departmentId: number;
    };
    query?: never;
    url: '/org/departments/{departmentId}/teams';
};
type PostOrgDepartmentsByDepartmentIdTeamsResponses = {
    /**
     * Created
     */
    201: Team;
};
type PostOrgDepartmentsByDepartmentIdTeamsResponse = PostOrgDepartmentsByDepartmentIdTeamsResponses[keyof PostOrgDepartmentsByDepartmentIdTeamsResponses];
type DeleteOrgDepartmentsByDepartmentIdTeamsByTeamIdData = {
    body?: never;
    path: {
        departmentId: number;
        teamId: number;
    };
    query?: never;
    url: '/org/departments/{departmentId}/teams/{teamId}';
};
type DeleteOrgDepartmentsByDepartmentIdTeamsByTeamIdResponses = {
    /**
     * Deleted
     */
    204: void;
};
type DeleteOrgDepartmentsByDepartmentIdTeamsByTeamIdResponse = DeleteOrgDepartmentsByDepartmentIdTeamsByTeamIdResponses[keyof DeleteOrgDepartmentsByDepartmentIdTeamsByTeamIdResponses];
type GetOrgDesignationsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/org/designations';
};
type GetOrgDesignationsResponses = {
    /**
     * Designations
     */
    200: Array<Designation>;
};
type GetOrgDesignationsResponse = GetOrgDesignationsResponses[keyof GetOrgDesignationsResponses];
type PostOrgDesignationsData = {
    body: {
        name?: string;
        description?: string;
    };
    path?: never;
    query?: never;
    url: '/org/designations';
};
type PostOrgDesignationsResponses = {
    /**
     * Created
     */
    201: Designation;
};
type PostOrgDesignationsResponse = PostOrgDesignationsResponses[keyof PostOrgDesignationsResponses];
type DeleteOrgDesignationsByIdData = {
    body?: never;
    path: {
        id: number;
    };
    query?: never;
    url: '/org/designations/{id}';
};
type DeleteOrgDesignationsByIdResponses = {
    /**
     * Deleted
     */
    204: void;
};
type DeleteOrgDesignationsByIdResponse = DeleteOrgDesignationsByIdResponses[keyof DeleteOrgDesignationsByIdResponses];
type PutOrgDesignationsByIdData = {
    body: {
        name?: string;
        description?: string;
    };
    path: {
        id: number;
    };
    query?: never;
    url: '/org/designations/{id}';
};
type PutOrgDesignationsByIdResponses = {
    /**
     * Updated
     */
    200: Designation;
};
type PutOrgDesignationsByIdResponse = PutOrgDesignationsByIdResponses[keyof PutOrgDesignationsByIdResponses];
type GetOrgUsersData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/org/users';
};
type GetOrgUsersResponses = {
    /**
     * Users
     */
    200: Array<User>;
};
type GetOrgUsersResponse = GetOrgUsersResponses[keyof GetOrgUsersResponses];
type PostOrgUsersData = {
    body: {
        name?: string;
        email?: string;
        phone?: string;
        department_id?: number;
        team_id?: number;
        designation_id?: number;
        roles?: Array<string>;
    };
    path?: never;
    query?: never;
    url: '/org/users';
};
type PostOrgUsersResponses = {
    /**
     * Created
     */
    201: User;
};
type PostOrgUsersResponse = PostOrgUsersResponses[keyof PostOrgUsersResponses];
type DeleteOrgUsersByIdData = {
    body?: never;
    path: {
        id: number;
    };
    query?: never;
    url: '/org/users/{id}';
};
type DeleteOrgUsersByIdResponses = {
    /**
     * Deleted
     */
    204: void;
};
type DeleteOrgUsersByIdResponse = DeleteOrgUsersByIdResponses[keyof DeleteOrgUsersByIdResponses];
type GetOrgUsersByIdData = {
    body?: never;
    path: {
        id: number;
    };
    query?: never;
    url: '/org/users/{id}';
};
type GetOrgUsersByIdResponses = {
    /**
     * User
     */
    200: User;
};
type GetOrgUsersByIdResponse = GetOrgUsersByIdResponses[keyof GetOrgUsersByIdResponses];
type PutOrgUsersByIdData = {
    body: {
        name?: string;
        email?: string;
        phone?: string;
        department_id?: number;
        team_id?: number;
        designation_id?: number;
        status?: 'active' | 'inactive';
        roles?: Array<string>;
    };
    path: {
        id: number;
    };
    query?: never;
    url: '/org/users/{id}';
};
type PutOrgUsersByIdResponses = {
    /**
     * Updated
     */
    200: User;
};
type PutOrgUsersByIdResponse = PutOrgUsersByIdResponses[keyof PutOrgUsersByIdResponses];
type PostAttendanceEventsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/attendance/events';
};
type PostAttendanceEventsResponses = {
    /**
     * OK
     */
    200: unknown;
};
type GetAttendanceDaysData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/attendance/days';
};
type GetAttendanceDaysResponses = {
    /**
     * OK
     */
    200: unknown;
};
type GetLeaveRequestsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/leave-requests';
};
type GetLeaveRequestsResponses = {
    /**
     * OK
     */
    200: unknown;
};
type PostLeaveRequestsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/leave-requests';
};
type PostLeaveRequestsResponses = {
    /**
     * Created
     */
    201: unknown;
};
type GetChatConversationsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/chat/conversations';
};
type GetChatConversationsResponses = {
    /**
     * OK
     */
    200: unknown;
};
type GetChatConversationsByIdMessagesData = {
    body?: never;
    path: {
        id: number;
    };
    query?: never;
    url: '/chat/conversations/{id}/messages';
};
type GetChatConversationsByIdMessagesResponses = {
    /**
     * OK
     */
    200: unknown;
};
type PostChatConversationsByIdMessagesData = {
    body?: never;
    path: {
        id: number;
    };
    query?: never;
    url: '/chat/conversations/{id}/messages';
};
type PostChatConversationsByIdMessagesResponses = {
    /**
     * Created
     */
    201: unknown;
};
type GetAdminSettingsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/admin/settings';
};
type GetAdminSettingsResponses = {
    /**
     * OK
     */
    200: unknown;
};
type PutAdminSettingsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/admin/settings';
};
type PutAdminSettingsResponses = {
    /**
     * OK
     */
    200: unknown;
};
type GetAdminAuditLogsData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/admin/audit-logs';
};
type GetAdminAuditLogsResponses = {
    /**
     * OK
     */
    200: unknown;
};

type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean, TResponse = unknown> = Options$1<TData, ThrowOnError, TResponse> & {
    /**
     * You can provide a client instance returned by `createClient()` instead of
     * individual options. This might be also useful if you want to implement a
     * custom client.
     */
    client?: Client;
    /**
     * You can pass arbitrary values through the `meta` object. This can be
     * used to access values that aren't defined as part of the SDK function.
     */
    meta?: keyof ClientMeta extends never ? Record<string, unknown> : ClientMeta;
};
/**
 * Health check endpoint
 *
 * Returns the health status of the API server.
 */
declare const getHealth: <ThrowOnError extends boolean = false>(options?: Options<GetHealthData, ThrowOnError>) => RequestResult<GetHealthResponses, unknown, ThrowOnError>;
/**
 * Authenticate a user
 *
 * Login using email or employee ID and password.
 */
declare const postAuthLogin: <ThrowOnError extends boolean = false>(options: Options<PostAuthLoginData, ThrowOnError>) => RequestResult<PostAuthLoginResponses, PostAuthLoginErrors, ThrowOnError>;
/**
 * Select active role
 *
 * Sets the active role for the current session.
 */
declare const postAuthRoleSelect: <ThrowOnError extends boolean = false>(options: Options<PostAuthRoleSelectData, ThrowOnError>) => RequestResult<PostAuthRoleSelectResponses, PostAuthRoleSelectErrors, ThrowOnError>;
/**
 * Request password reset
 */
declare const postAuthForgotPassword: <ThrowOnError extends boolean = false>(options: Options<PostAuthForgotPasswordData, ThrowOnError>) => RequestResult<PostAuthForgotPasswordResponses, unknown, ThrowOnError>;
/**
 * Reset password using token
 */
declare const postAuthResetPassword: <ThrowOnError extends boolean = false>(options: Options<PostAuthResetPasswordData, ThrowOnError>) => RequestResult<PostAuthResetPasswordResponses, unknown, ThrowOnError>;
/**
 * Change password (first login or profile)
 */
declare const postAuthChangePassword: <ThrowOnError extends boolean = false>(options: Options<PostAuthChangePasswordData, ThrowOnError>) => RequestResult<PostAuthChangePasswordResponses, unknown, ThrowOnError>;
/**
 * List active sessions
 */
declare const getAuthSessions: <ThrowOnError extends boolean = false>(options?: Options<GetAuthSessionsData, ThrowOnError>) => RequestResult<GetAuthSessionsResponses, unknown, ThrowOnError>;
/**
 * Revoke a specific session
 */
declare const deleteAuthSessionsById: <ThrowOnError extends boolean = false>(options: Options<DeleteAuthSessionsByIdData, ThrowOnError>) => RequestResult<DeleteAuthSessionsByIdResponses, unknown, ThrowOnError>;
/**
 * Logout current session
 */
declare const postAuthLogout: <ThrowOnError extends boolean = false>(options?: Options<PostAuthLogoutData, ThrowOnError>) => RequestResult<PostAuthLogoutResponses, unknown, ThrowOnError>;
/**
 * Get current user profile
 */
declare const getAuthProfile: <ThrowOnError extends boolean = false>(options?: Options<GetAuthProfileData, ThrowOnError>) => RequestResult<GetAuthProfileResponses, unknown, ThrowOnError>;
/**
 * Update current user profile
 */
declare const putAuthProfile: <ThrowOnError extends boolean = false>(options: Options<PutAuthProfileData, ThrowOnError>) => RequestResult<PutAuthProfileResponses, unknown, ThrowOnError>;
/**
 * Get employee directory
 */
declare const getDirectory: <ThrowOnError extends boolean = false>(options?: Options<GetDirectoryData, ThrowOnError>) => RequestResult<GetDirectoryResponses, unknown, ThrowOnError>;
/**
 * List departments
 */
declare const getOrgDepartments: <ThrowOnError extends boolean = false>(options?: Options<GetOrgDepartmentsData, ThrowOnError>) => RequestResult<GetOrgDepartmentsResponses, unknown, ThrowOnError>;
/**
 * Create department
 */
declare const postOrgDepartments: <ThrowOnError extends boolean = false>(options: Options<PostOrgDepartmentsData, ThrowOnError>) => RequestResult<PostOrgDepartmentsResponses, unknown, ThrowOnError>;
/**
 * Delete department
 */
declare const deleteOrgDepartmentsById: <ThrowOnError extends boolean = false>(options: Options<DeleteOrgDepartmentsByIdData, ThrowOnError>) => RequestResult<DeleteOrgDepartmentsByIdResponses, unknown, ThrowOnError>;
/**
 * Get department
 */
declare const getOrgDepartmentsById: <ThrowOnError extends boolean = false>(options: Options<GetOrgDepartmentsByIdData, ThrowOnError>) => RequestResult<GetOrgDepartmentsByIdResponses, unknown, ThrowOnError>;
/**
 * Update department
 */
declare const putOrgDepartmentsById: <ThrowOnError extends boolean = false>(options: Options<PutOrgDepartmentsByIdData, ThrowOnError>) => RequestResult<PutOrgDepartmentsByIdResponses, unknown, ThrowOnError>;
/**
 * Create team
 */
declare const postOrgDepartmentsByDepartmentIdTeams: <ThrowOnError extends boolean = false>(options: Options<PostOrgDepartmentsByDepartmentIdTeamsData, ThrowOnError>) => RequestResult<PostOrgDepartmentsByDepartmentIdTeamsResponses, unknown, ThrowOnError>;
/**
 * Delete team
 */
declare const deleteOrgDepartmentsByDepartmentIdTeamsByTeamId: <ThrowOnError extends boolean = false>(options: Options<DeleteOrgDepartmentsByDepartmentIdTeamsByTeamIdData, ThrowOnError>) => RequestResult<DeleteOrgDepartmentsByDepartmentIdTeamsByTeamIdResponses, unknown, ThrowOnError>;
/**
 * List designations
 */
declare const getOrgDesignations: <ThrowOnError extends boolean = false>(options?: Options<GetOrgDesignationsData, ThrowOnError>) => RequestResult<GetOrgDesignationsResponses, unknown, ThrowOnError>;
/**
 * Create designation
 */
declare const postOrgDesignations: <ThrowOnError extends boolean = false>(options: Options<PostOrgDesignationsData, ThrowOnError>) => RequestResult<PostOrgDesignationsResponses, unknown, ThrowOnError>;
/**
 * Delete designation
 */
declare const deleteOrgDesignationsById: <ThrowOnError extends boolean = false>(options: Options<DeleteOrgDesignationsByIdData, ThrowOnError>) => RequestResult<DeleteOrgDesignationsByIdResponses, unknown, ThrowOnError>;
/**
 * Update designation
 */
declare const putOrgDesignationsById: <ThrowOnError extends boolean = false>(options: Options<PutOrgDesignationsByIdData, ThrowOnError>) => RequestResult<PutOrgDesignationsByIdResponses, unknown, ThrowOnError>;
/**
 * List users
 */
declare const getOrgUsers: <ThrowOnError extends boolean = false>(options?: Options<GetOrgUsersData, ThrowOnError>) => RequestResult<GetOrgUsersResponses, unknown, ThrowOnError>;
/**
 * Create user
 */
declare const postOrgUsers: <ThrowOnError extends boolean = false>(options: Options<PostOrgUsersData, ThrowOnError>) => RequestResult<PostOrgUsersResponses, unknown, ThrowOnError>;
/**
 * Delete user
 */
declare const deleteOrgUsersById: <ThrowOnError extends boolean = false>(options: Options<DeleteOrgUsersByIdData, ThrowOnError>) => RequestResult<DeleteOrgUsersByIdResponses, unknown, ThrowOnError>;
/**
 * Get user
 */
declare const getOrgUsersById: <ThrowOnError extends boolean = false>(options: Options<GetOrgUsersByIdData, ThrowOnError>) => RequestResult<GetOrgUsersByIdResponses, unknown, ThrowOnError>;
/**
 * Update user
 */
declare const putOrgUsersById: <ThrowOnError extends boolean = false>(options: Options<PutOrgUsersByIdData, ThrowOnError>) => RequestResult<PutOrgUsersByIdResponses, unknown, ThrowOnError>;
/**
 * Clock in/out or break events
 */
declare const postAttendanceEvents: <ThrowOnError extends boolean = false>(options?: Options<PostAttendanceEventsData, ThrowOnError>) => RequestResult<PostAttendanceEventsResponses, unknown, ThrowOnError>;
/**
 * Get attendance heatmap
 */
declare const getAttendanceDays: <ThrowOnError extends boolean = false>(options?: Options<GetAttendanceDaysData, ThrowOnError>) => RequestResult<GetAttendanceDaysResponses, unknown, ThrowOnError>;
/**
 * Get leave requests
 */
declare const getLeaveRequests: <ThrowOnError extends boolean = false>(options?: Options<GetLeaveRequestsData, ThrowOnError>) => RequestResult<GetLeaveRequestsResponses, unknown, ThrowOnError>;
/**
 * Submit leave request
 */
declare const postLeaveRequests: <ThrowOnError extends boolean = false>(options?: Options<PostLeaveRequestsData, ThrowOnError>) => RequestResult<PostLeaveRequestsResponses, unknown, ThrowOnError>;
/**
 * Get conversations
 */
declare const getChatConversations: <ThrowOnError extends boolean = false>(options?: Options<GetChatConversationsData, ThrowOnError>) => RequestResult<GetChatConversationsResponses, unknown, ThrowOnError>;
/**
 * Get messages
 */
declare const getChatConversationsByIdMessages: <ThrowOnError extends boolean = false>(options: Options<GetChatConversationsByIdMessagesData, ThrowOnError>) => RequestResult<GetChatConversationsByIdMessagesResponses, unknown, ThrowOnError>;
/**
 * Send message
 */
declare const postChatConversationsByIdMessages: <ThrowOnError extends boolean = false>(options: Options<PostChatConversationsByIdMessagesData, ThrowOnError>) => RequestResult<PostChatConversationsByIdMessagesResponses, unknown, ThrowOnError>;
/**
 * Get system settings
 */
declare const getAdminSettings: <ThrowOnError extends boolean = false>(options?: Options<GetAdminSettingsData, ThrowOnError>) => RequestResult<GetAdminSettingsResponses, unknown, ThrowOnError>;
/**
 * Update settings
 */
declare const putAdminSettings: <ThrowOnError extends boolean = false>(options?: Options<PutAdminSettingsData, ThrowOnError>) => RequestResult<PutAdminSettingsResponses, unknown, ThrowOnError>;
/**
 * Get audit logs
 */
declare const getAdminAuditLogs: <ThrowOnError extends boolean = false>(options?: Options<GetAdminAuditLogsData, ThrowOnError>) => RequestResult<GetAdminAuditLogsResponses, unknown, ThrowOnError>;

export { type AuthResponse, type ClientOptions, type DeleteAuthSessionsByIdData, type DeleteAuthSessionsByIdResponses, type DeleteOrgDepartmentsByDepartmentIdTeamsByTeamIdData, type DeleteOrgDepartmentsByDepartmentIdTeamsByTeamIdResponse, type DeleteOrgDepartmentsByDepartmentIdTeamsByTeamIdResponses, type DeleteOrgDepartmentsByIdData, type DeleteOrgDepartmentsByIdResponse, type DeleteOrgDepartmentsByIdResponses, type DeleteOrgDesignationsByIdData, type DeleteOrgDesignationsByIdResponse, type DeleteOrgDesignationsByIdResponses, type DeleteOrgUsersByIdData, type DeleteOrgUsersByIdResponse, type DeleteOrgUsersByIdResponses, type Department, type Designation, type GetAdminAuditLogsData, type GetAdminAuditLogsResponses, type GetAdminSettingsData, type GetAdminSettingsResponses, type GetAttendanceDaysData, type GetAttendanceDaysResponses, type GetAuthProfileData, type GetAuthProfileResponse, type GetAuthProfileResponses, type GetAuthSessionsData, type GetAuthSessionsResponse, type GetAuthSessionsResponses, type GetChatConversationsByIdMessagesData, type GetChatConversationsByIdMessagesResponses, type GetChatConversationsData, type GetChatConversationsResponses, type GetDirectoryData, type GetDirectoryResponse, type GetDirectoryResponses, type GetHealthData, type GetHealthResponse, type GetHealthResponses, type GetLeaveRequestsData, type GetLeaveRequestsResponses, type GetOrgDepartmentsByIdData, type GetOrgDepartmentsByIdResponse, type GetOrgDepartmentsByIdResponses, type GetOrgDepartmentsData, type GetOrgDepartmentsResponse, type GetOrgDepartmentsResponses, type GetOrgDesignationsData, type GetOrgDesignationsResponse, type GetOrgDesignationsResponses, type GetOrgUsersByIdData, type GetOrgUsersByIdResponse, type GetOrgUsersByIdResponses, type GetOrgUsersData, type GetOrgUsersResponse, type GetOrgUsersResponses, type Options, type PostAttendanceEventsData, type PostAttendanceEventsResponses, type PostAuthChangePasswordData, type PostAuthChangePasswordResponses, type PostAuthForgotPasswordData, type PostAuthForgotPasswordResponses, type PostAuthLoginData, type PostAuthLoginErrors, type PostAuthLoginResponse, type PostAuthLoginResponses, type PostAuthLogoutData, type PostAuthLogoutResponses, type PostAuthResetPasswordData, type PostAuthResetPasswordResponses, type PostAuthRoleSelectData, type PostAuthRoleSelectErrors, type PostAuthRoleSelectResponse, type PostAuthRoleSelectResponses, type PostChatConversationsByIdMessagesData, type PostChatConversationsByIdMessagesResponses, type PostLeaveRequestsData, type PostLeaveRequestsResponses, type PostOrgDepartmentsByDepartmentIdTeamsData, type PostOrgDepartmentsByDepartmentIdTeamsResponse, type PostOrgDepartmentsByDepartmentIdTeamsResponses, type PostOrgDepartmentsData, type PostOrgDepartmentsResponse, type PostOrgDepartmentsResponses, type PostOrgDesignationsData, type PostOrgDesignationsResponse, type PostOrgDesignationsResponses, type PostOrgUsersData, type PostOrgUsersResponse, type PostOrgUsersResponses, type PutAdminSettingsData, type PutAdminSettingsResponses, type PutAuthProfileData, type PutAuthProfileResponse, type PutAuthProfileResponses, type PutOrgDepartmentsByIdData, type PutOrgDepartmentsByIdResponse, type PutOrgDepartmentsByIdResponses, type PutOrgDesignationsByIdData, type PutOrgDesignationsByIdResponse, type PutOrgDesignationsByIdResponses, type PutOrgUsersByIdData, type PutOrgUsersByIdResponse, type PutOrgUsersByIdResponses, type Session, type Team, type User, deleteAuthSessionsById, deleteOrgDepartmentsByDepartmentIdTeamsByTeamId, deleteOrgDepartmentsById, deleteOrgDesignationsById, deleteOrgUsersById, getAdminAuditLogs, getAdminSettings, getAttendanceDays, getAuthProfile, getAuthSessions, getChatConversations, getChatConversationsByIdMessages, getDirectory, getHealth, getLeaveRequests, getOrgDepartments, getOrgDepartmentsById, getOrgDesignations, getOrgUsers, getOrgUsersById, postAttendanceEvents, postAuthChangePassword, postAuthForgotPassword, postAuthLogin, postAuthLogout, postAuthResetPassword, postAuthRoleSelect, postChatConversationsByIdMessages, postLeaveRequests, postOrgDepartments, postOrgDepartmentsByDepartmentIdTeams, postOrgDesignations, postOrgUsers, putAdminSettings, putAuthProfile, putOrgDepartmentsById, putOrgDesignationsById, putOrgUsersById };
