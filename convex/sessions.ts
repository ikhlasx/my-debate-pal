import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
    args: {
        partnerId: v.string(),
        partner: v.union(v.literal("husband"), v.literal("wife")),
        startTime: v.string(),
        endTime: v.optional(v.string()),
        duration: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("debate_sessions", {
            partnerId: args.partnerId,
            partner: args.partner,
            startTime: args.startTime,
            endTime: args.endTime,
            duration: args.duration,
        });
        return id;
    },
});

export const list = query({
    args: {
        partnerId: v.string(),
        partner: v.optional(v.union(v.literal("husband"), v.literal("wife"))),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let q = ctx.db
            .query("debate_sessions")
            .withIndex("by_partner_id", (q) => q.eq("partnerId", args.partnerId));

        // Convex queries are not as flexible as SQL for dynamic filtering after the index
        // so we filter in memory for simplicity unless volume is huge.
        // Given the index is on partnerId, we fetch all for the user and filter.
        const sessions = await q.collect();

        return sessions
            .filter((s) => {
                if (args.partner && s.partner !== args.partner) return false;
                if (args.startDate && s.startTime < args.startDate) return false;
                if (args.endDate && s.startTime > args.endDate) return false;
                return true;
            })
            .sort((a, b) => (new Date(b.startTime).getTime() - new Date(a.startTime).getTime())); // Descending
    },
});

export const get = query({
    args: { id: v.id("debate_sessions") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const update = mutation({
    args: {
        id: v.id("debate_sessions"),
        endTime: v.optional(v.string()),
        duration: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("debate_sessions") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
