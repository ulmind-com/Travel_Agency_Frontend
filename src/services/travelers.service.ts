import { api } from "@/lib/api";
import { withId, type Gender, type SavedTraveler } from "@/types/api";

export type TravelerInput = {
  name: string;
  gender: Gender;
  age: number;
  relation?: string;
};

export const travelersService = {
  async list(): Promise<Array<SavedTraveler & { id: string }>> {
    const { data } = await api.get<SavedTraveler[]>("/users/travelers");
    return (data ?? []).map(withId);
  },
  async create(input: TravelerInput) {
    const form = new FormData();
    form.append("name", input.name);
    form.append("gender", input.gender);
    form.append("age", String(input.age));
    if (input.relation) form.append("relation", input.relation);
    const { data } = await api.post("/users/travelers", form);
    return data;
  },
  async update(travelerId: string, input: Partial<TravelerInput>) {
    const { data } = await api.put(`/users/travelers/${travelerId}`, input);
    return data;
  },
  async remove(travelerId: string) {
    await api.delete(`/users/travelers/${travelerId}`);
  },
};