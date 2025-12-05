require 'net/http'
require 'uri'

class UrlContentFetcher
  TIMEOUT = 5
  MAX_SIZE = 262_144 # 256KB
  MAX_REDIRECTS = 5

  def self.call(url)
    new(url).call
  end

  def initialize(url)
    @url = url
  end

  def call
    fetch_with_redirects(@url, 0)
  rescue StandardError => e
    Rails.logger.error("UrlContentFetcher failed for #{@url}: #{e.message}")
    { success: false, content: nil, error: e.message }
  end

  private

  def fetch_with_redirects(url, redirect_count)
    return { success: false, content: nil, error: "Too many redirects" } if redirect_count > MAX_REDIRECTS

    uri = URI.parse(url)
    return { success: false, content: nil, error: "Invalid URL scheme" } unless uri.is_a?(URI::HTTP) || uri.is_a?(URI::HTTPS)

    response = Net::HTTP.start(uri.host, uri.port,
      use_ssl: uri.scheme == 'https',
      open_timeout: TIMEOUT,
      read_timeout: TIMEOUT
    ) do |http|
      http.get(uri.request_uri)
    end

    case response
    when Net::HTTPSuccess
      content = response.body.byteslice(0, MAX_SIZE) # Limit size
      { success: true, content: content, error: nil }
    when Net::HTTPRedirection
      fetch_with_redirects(response['location'], redirect_count + 1)
    else
      { success: false, content: nil, error: "HTTP #{response.code}" }
    end
  end
end
