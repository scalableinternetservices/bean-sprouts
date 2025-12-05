class AddSummaryToConversations < ActiveRecord::Migration[8.1]
  def change
    add_column :conversations, :summary, :text
  end
end
