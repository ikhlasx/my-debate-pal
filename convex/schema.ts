import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        // We'll just track users by a string ID for now to match strict parity with current simple auth
        // In a real app, this would be linked to an auth provider identity
        partnerId: v.string(),
        email: v.optional(v.string()),
        name: v.optional(v.string()),
    }).index("by_partner_id", ["partnerId"]),

    debate_sessions: defineTable({
        partnerId: v.string(), // The user who owns this data
        partner: v.union(v.literal("husband"), v.literal("wife")),
        startTime: v.string(), // ISO string
        endTime: v.optional(v.string()), // ISO string
        duration: v.optional(v.number()), // Seconds
    })
        .index("by_partner_id", ["partnerId"])
        .index("by_partner_id_and_start_time", ["partnerId", "startTime"]),

    notifications: defineTable({
        partnerId: v.string(),
        type: v.string(),
        title: v.string(),
        message: v.string(),
        partner: v.optional(v.union(v.literal("husband"), v.literal("wife"))),
        data: v.optional(v.any()), // JSON data
        read: v.boolean(),
    })
        .index("by_partner_id", ["partnerId"]),
});
