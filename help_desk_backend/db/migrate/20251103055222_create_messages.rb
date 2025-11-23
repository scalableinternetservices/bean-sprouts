class CreateMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :messages do |t|
      t.bigint :conversation_id, null: false
      t.bigint :sender_id, null: false
      t.string :sender_role, null: false  # enum in validations
      t.text :content, null: false
      t.boolean :is_read, null: false, default: false

      t.timestamps
    end

    add_index :messages, :conversation_id
    add_index :messages, :sender_id
    add_index :messages, [:conversation_id, :created_at]
        # optimize fetching messages for conversation in chronological order

    add_foreign_key :messages, :conversations, column: :conversation_id, on_delete: :cascade
    add_foreign_key :messages, :users, column: :sender_id, on_delete: :cascade
  end
end
