import {Member} from "@/types";

function useMemberForm(member: Member | null) {
	// Returns:
	// - formData (typed correctly for create vs edit)
	// - updateField(field, value) with auto error clearing
	// - errors (field-level validation)
	// - isLoading
	// - handleSubmit() — calls useMembers().createMember or updateMember
	//                     + useMemberMetadata() for metadata fields
	// - reset()
}