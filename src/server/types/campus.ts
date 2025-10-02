export interface CampusDTO {
  code: string;
  name: string;
  city: string;
}

export interface RawCampusItem {
  kode?: string | number;
  id?: string | number;
  nama?: string;
  kota?: string;
  kabupaten?: string;
}

export interface CampusApiResponse {
  success?: number;
  message?: string;
  data?: RawCampusItem[];
}
