import ClientProof from "../ClientProof";
import { CASES } from "./content";

// Client proof on the Reddit page: see ClientProof. Real thread screenshots join the case studies once they are final.
export default function Cases() {
  return <ClientProof label={CASES.label} title={CASES.title} slots={CASES.slots} cases={CASES.cases} />;
}
