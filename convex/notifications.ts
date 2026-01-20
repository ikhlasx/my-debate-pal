import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
    args: {
        partnerId: v.string(),
        type: v.string(),
        title: v.string(),
        message: v.string(),
        partner: v.optional(v.union(v.literal("husband"), v.literal("wife"))),
        data: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("notifications", {
            partnerId: args.partnerId,
            type: args.type,
            title: args.title,
            message: args.message,
            partner: args.partner,
            data: args.data,
            read: false,
        });
        return id;
    },
});

export const list = query({
    args: {
        partnerId: v.string(),
        partner: v.optional(v.union(v.literal("husband"), v.literal("wife"))),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let q = ctx.db
            .query("notifications")
            .withIndex("by_partner_id", (q) => q.eq("partnerId", args.partnerId));

        const notifications = await q.order("desc").collect();

        // In-memory filter for partner if needed
        const filtered = args.partner
            ? notifications.filter(n => n.partner === args.partner)
            : notifications;

        return filtered.slice(0, args.limit ?? 50);
    },
});

export const markRead = mutation({
    args: { id: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { read: true });
    },
});
