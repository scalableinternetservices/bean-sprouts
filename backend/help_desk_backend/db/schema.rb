# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_12_04_225131) do
  create_table "conversations", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "assigned_expert_id"
    t.datetime "created_at", null: false
    t.bigint "initiator_id", null: false
    t.datetime "last_message_at"
    t.string "status", default: "waiting", null: false
    t.text "summary"
    t.datetime "summary_updated_at"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["assigned_expert_id"], name: "index_conversations_on_assigned_expert_id"
    t.index ["initiator_id"], name: "index_conversations_on_initiator_id"
    t.index ["status"], name: "index_conversations_on_status"
  end

  create_table "expert_assignments", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.datetime "assigned_at", null: false
    t.bigint "conversation_id", null: false
    t.datetime "created_at", null: false
    t.bigint "expert_id", null: false
    t.datetime "resolved_at"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["conversation_id"], name: "index_expert_assignments_on_conversation_id"
    t.index ["expert_id", "status"], name: "index_expert_assignments_on_expert_id_and_status"
    t.index ["expert_id"], name: "index_expert_assignments_on_expert_id"
  end

  create_table "expert_profiles", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.text "bio"
    t.datetime "created_at", null: false
    t.json "knowledge_base_links"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_expert_profiles_on_user_id", unique: true
  end

  create_table "messages", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.text "content", null: false
    t.bigint "conversation_id", null: false
    t.datetime "created_at", null: false
    t.boolean "is_read", default: false, null: false
    t.bigint "sender_id", null: false
    t.string "sender_role", null: false
    t.datetime "updated_at", null: false
    t.index ["conversation_id", "created_at"], name: "index_messages_on_conversation_id_and_created_at"
    t.index ["conversation_id"], name: "index_messages_on_conversation_id"
    t.index ["sender_id"], name: "index_messages_on_sender_id"
  end

  create_table "sessions", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "data"
    t.string "session_id", null: false
    t.datetime "updated_at", null: false
    t.index ["session_id"], name: "index_sessions_on_session_id", unique: true
    t.index ["updated_at"], name: "index_sessions_on_updated_at"
  end

  create_table "users", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "last_active_at"
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.string "username", null: false
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "conversations", "users", column: "assigned_expert_id", on_delete: :nullify
  add_foreign_key "conversations", "users", column: "initiator_id", on_delete: :cascade
  add_foreign_key "expert_assignments", "conversations", on_delete: :cascade
  add_foreign_key "expert_assignments", "users", column: "expert_id", on_delete: :cascade
  add_foreign_key "expert_profiles", "users", on_delete: :cascade
  add_foreign_key "messages", "conversations", on_delete: :cascade
  add_foreign_key "messages", "users", column: "sender_id", on_delete: :cascade
end
