// Actions a dispatcher can record for an alert. The backend accepts any
// non-empty action string (max 256 bytes); these are the ones the UI offers.
export const RESPONSE_ACTIONS = [
  { value: "moved_to_backup_cooler", label: "Moved to backup cooler" },
  { value: "contacted_driver", label: "Contacted driver" },
  { value: "rerouted_to_cold_warehouse", label: "Rerouted to cold warehouse" },
];

export function actionLabel(action) {
  const known = RESPONSE_ACTIONS.find((item) => item.value === action);
  return known ? known.label : String(action).replace(/_/g, " ");
}
