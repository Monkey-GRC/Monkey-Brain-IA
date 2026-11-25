// The page the backend returns (contracts/conventions.md): `page` starts at 1. The one `PageInfo` of both apps; the domain owns it (services and `ClientList` use it)
// and `data-table`, `pagination` and `table-page` read it from here.
export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
