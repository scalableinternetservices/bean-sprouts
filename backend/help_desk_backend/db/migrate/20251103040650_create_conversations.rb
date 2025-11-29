class CreateConversations < ActiveRecord::Migration[8.1]
  def change
    create_table :conversations do |t|
      t.string    :title, null:false
      t.string    :status, null:false, default: 'waiting'
      t.bigint    :initiator_id, null:false
      t.bigint    :assigned_expert_id
      t.datetime  :last_message_at

      t.timestamps
    end

    # makes it easier to query/filter by initiator, assigned expert, or status
    add_index   :conversations, :initiator_id
    add_index   :conversations, :assigned_expert_id
    add_index   :conversations, :status

    # ensure referential integrity at database level:
    add_foreign_key :conversations, :users, column: :initiator_id, on_delete: :cascade
        # delete conversation if its initiator is deleted
    add_foreign_key :conversations, :users, column: :assigned_expert_id, on_delete: :nullify
        # nullify assigned expert if that user is deleted
  end
end
