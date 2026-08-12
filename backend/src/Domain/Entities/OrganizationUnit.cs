namespace Domain.Entities;

public class OrganizationUnit
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Guid? ParentId { get; set; }
    public OrganizationUnit? Parent { get; set; }
    public ICollection<OrganizationUnit> Children { get; set; } = new List<OrganizationUnit>();

    /// <summary>
    /// Materialized path storing the full ancestor chain, e.g. "/rootId/parentId/thisId/".
    /// Used for efficient hierarchy queries and circular reference prevention.
    /// </summary>
    public string Path { get; set; } = string.Empty;
    public int Level { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
}